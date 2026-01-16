import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { Tooltip } from 'react-tooltip';
import { useThemeStore } from '../store/themeStore';
import taiwanCounties from '../assets/taiwan-counties.json';

// System Location Codes mapped to Display Names
export const TAIWAN_LOCATIONS: Record<string, { name: string; coordinates: [number, number] }> = {
    TPE: { name: '台北市', coordinates: [121.5654, 25.0330] },
    TPH: { name: '新北市', coordinates: [121.4657, 25.0125] },
    KLU: { name: '基隆市', coordinates: [121.7419, 25.1276] },
    TYC: { name: '桃園市', coordinates: [121.3009, 24.9936] },
    HCH: { name: '新竹縣', coordinates: [121.1611, 24.7073] },
    HAC: { name: '新竹市', coordinates: [120.9675, 24.8138] },
    MAL: { name: '苗栗縣', coordinates: [120.8207, 24.5650] },
    TXG: { name: '台中市', coordinates: [120.6736, 24.1477] },
    CWH: { name: '彰化縣', coordinates: [120.5396, 24.0567] },
    NTO: { name: '南投縣', coordinates: [120.9605, 23.9609] },
    YUN: { name: '雲林縣', coordinates: [120.5332, 23.7092] },
    CHY: { name: '嘉義縣', coordinates: [120.5746, 23.4518] },
    CYI: { name: '嘉義市', coordinates: [120.4491, 23.4800] },
    TNN: { name: '台南市', coordinates: [120.1973, 22.9997] },
    KHH: { name: '高雄市', coordinates: [120.3014, 22.6273] },
    IUH: { name: '屏東縣', coordinates: [120.4856, 22.6744] },
    ILA: { name: '宜蘭縣', coordinates: [121.7611, 24.7021] },
    HWA: { name: '花蓮縣', coordinates: [121.6011, 23.9871] },
    TTT: { name: '台東縣', coordinates: [121.1456, 22.7583] },
    PEH: { name: '澎湖縣', coordinates: [119.5793, 23.5711] },
    KMN: { name: '金門縣', coordinates: [118.3201, 24.4400] },
    LNN: { name: '連江縣', coordinates: [119.9288, 26.1557] },
};

// Map from TopoJSON COUNTYNAME to Location Code
const NAME_TO_CODE: Record<string, string> = {
    '臺北市': 'TPE', '台北市': 'TPE',
    '新北市': 'TPH',
    '基隆市': 'KLU',
    '桃園市': 'TYC',
    '新竹縣': 'HCH',
    '新竹市': 'HAC',
    '苗栗縣': 'MAL',
    '臺中市': 'TXG', '台中市': 'TXG',
    '彰化縣': 'CWH',
    '南投縣': 'NTO',
    '雲林縣': 'YUN',
    '嘉義縣': 'CHY',
    '嘉義市': 'CYI',
    '臺南市': 'TNN', '台南市': 'TNN',
    '高雄市': 'KHH',
    '屏東縣': 'IUH',
    '宜蘭縣': 'ILA',
    '花蓮縣': 'HWA',
    '臺東縣': 'TTT', '台東縣': 'TTT',
    '澎湖縣': 'PEH',
    '金門縣': 'KMN',
    '連江縣': 'LNN',
};

interface TaiwanMapProps {
    onSelect: (locationCode: string) => void;
    selectedLocation?: string;
}

const TaiwanMap: React.FC<TaiwanMapProps> = ({ onSelect, selectedLocation }) => {
    // Select mode directly for reactivity and derive boolean
    const isDark = useThemeStore((state) => state.mode === 'dark');
    const [hoveredCode, setHoveredCode] = useState<string | null>(null);

    // Distinct color palette for counties
    const COUNTY_COLORS = [
        '#FFADAD', '#FFD6A5', '#FDFFB6', '#CAFFBF', '#9BF6FF',
        '#A0C4FF', '#BDB2FF', '#FFC6FF', '#FFFFFC', '#e4c1f9',
        '#fbf8cc', '#fde4cf', '#ffcfd2', '#f1c0e8', '#cfbaf0',
        '#a3c4f3', '#90dbf4', '#8eecf5', '#98f5e1', '#b9fbc0'
    ];

    // Helper to get color based on code index (consistent coloring)
    const getCountyColor = (index: number) => {
        return COUNTY_COLORS[index % COUNTY_COLORS.length];
    };

    return (
        <div className="taiwan-map-container" style={{ width: '100%', height: '100%', maxHeight: '600px' }}>
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    center: [120.5, 23.8], // Adjusted center to include Kinmen/Matsu/Penghu
                    scale: 5500, // Adjusted scale to fit all islands
                }}
                style={{ width: '100%', height: '100%' }}
            >
                <ZoomableGroup center={[120.5, 23.8]} zoom={1}>
                    <Geographies geography={taiwanCounties}>
                        {({ geographies }) => {
                            // Sort geographies to put the selected one last (render on top)
                            const sortedGeographies = [...geographies].sort((a, b) => {
                                const codeA = NAME_TO_CODE[a.properties?.COUNTYNAME];
                                const codeB = NAME_TO_CODE[b.properties?.COUNTYNAME];
                                if (codeA === selectedLocation) return 1;
                                if (codeB === selectedLocation) return -1;
                                return 0;
                            });

                            return sortedGeographies.map((geo, index) => {
                                // Ensure geo.properties is defined before accessing
                                const countyName = geo.properties ? geo.properties.COUNTYNAME : '';

                                // Lookup code using the string key
                                const code = NAME_TO_CODE[countyName];

                                if (!code) return null;

                                const isSelected = selectedLocation === code;
                                const isHovered = hoveredCode === code;

                                // Identify if this is an outlying island
                                const isIsland = ['KMN', 'LNN', 'PEH'].includes(code);

                                // Determine fill color
                                let fillColor = isDark
                                    ? (isSelected ? '#ecc94b' : '#2D3748')
                                    : (isSelected ? '#3182ce' : getCountyColor(index));

                                // Island specific overrides for better visibility
                                if (isIsland && !isSelected) {
                                    // Use distinct, darker colors for islands to make them pop
                                    // KMN: #e53e3e (Red), LNN: #805ad5 (Purple), PEH: #319795 (Teal)
                                    if (code === 'KMN') fillColor = isDark ? '#fc8181' : '#ff6b6b';
                                    if (code === 'LNN') fillColor = isDark ? '#b794f4' : '#9f7aea';
                                    if (code === 'PEH') fillColor = isDark ? '#4fd1c5' : '#38b2ac';
                                }

                                if (isDark && !isSelected && !isIsland) {
                                    fillColor = getCountyColor(index);
                                }

                                // Override for Light Mode Selected
                                if (!isDark && isSelected) {
                                    fillColor = '#3182ce'; // Strong Blue
                                } else if (isDark && isSelected) {
                                    fillColor = '#ecc94b'; // Strong Yellow for dark mode selected
                                }

                                // Hover overrides
                                if (isHovered) {
                                    fillColor = isDark ? '#d69e2e' : '#2c5282';
                                }

                                // Style calculation for stroke
                                const strokeWidth = isIsland ? 4 : (isSelected ? 2 : 1);

                                // Enhanced stroke for selected item
                                let strokeColor = isDark ? '#1A202C' : '#FFFFFF';
                                if (isIsland) {
                                    strokeColor = !isDark ? fillColor : '#1A202C';
                                }
                                if (isSelected) {
                                    strokeColor = '#FFFFFF'; // Always white stroke for selection to pop
                                    if (isDark) strokeColor = '#FFFFFF'; // Even in dark mode, white stroke pops well against dark bg + yellow fill
                                }

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onMouseEnter={() => setHoveredCode(code)}
                                        onMouseLeave={() => setHoveredCode(null)}
                                        onClick={() => onSelect(code)}
                                        data-tooltip-id="taiwan-map-tooltip"
                                        data-tooltip-content={TAIWAN_LOCATIONS[code]?.name || countyName}
                                        style={{
                                            default: {
                                                fill: fillColor,
                                                stroke: strokeColor,
                                                strokeWidth: strokeWidth,
                                                outline: 'none',
                                                transition: 'all 0.3s ease',
                                                opacity: isDark && !isSelected ? 0.8 : 1,
                                                filter: isSelected ? 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.5))' : 'none', // Drop shadow for pop effect
                                                zIndex: isSelected ? 10 : 1 // Logic handled by sort order, but good for intent
                                            },
                                            hover: {
                                                fill: fillColor,
                                                stroke: strokeColor,
                                                strokeWidth: isSelected ? 2 : 2,
                                                outline: 'none',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                opacity: 1,
                                                filter: isIsland || isSelected ? 'brightness(1.1) drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.5))' : 'none'
                                            },
                                            pressed: {
                                                fill: fillColor,
                                                outline: 'none',
                                            },
                                        }}
                                    />
                                );
                            });
                        }}
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>
            <Tooltip
                id="taiwan-map-tooltip"
                style={{
                    backgroundColor: isDark ? '#1A202C' : '#FFFFFF',
                    color: isDark ? '#FFFFFF' : '#1A202C',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                opacity={1}
            />
        </div>
    );
};

export default TaiwanMap;
