/**
 * P5.js 背景動畫元件
 * 創建動態粒子系統作為頁面背景
 */
import React, { useRef, useEffect } from 'react';
import p5 from 'p5';

interface P5BackgroundProps {
    variant?: 'particles' | 'waves' | 'network';
    opacity?: number;
    color?: string;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
}

const P5Background: React.FC<P5BackgroundProps> = ({
    variant = 'particles',
    opacity = 0.6,
    color = '#667eea'
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const p5Instance = useRef<p5 | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // 解析顏色
        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 102, g: 126, b: 234 };
        };

        const rgb = hexToRgb(color);

        const sketch = (p: p5) => {
            const particles: Particle[] = [];
            const maxParticles = 80;  // 減少粒子數量但增大尺寸
            let time = 0;

            p.setup = () => {
                const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
                canvas.style('position', 'fixed');
                canvas.style('top', '0');
                canvas.style('left', '0');
                canvas.style('z-index', '-1');
                canvas.style('pointer-events', 'none');

                // 初始化粒子
                for (let i = 0; i < maxParticles; i++) {
                    particles.push(createParticle(p));
                }
            };

            const createParticle = (p: p5): Particle => ({
                x: p.random(p.width),
                y: p.random(p.height),
                vx: p.random(-0.5, 0.5),   // 速度適中
                vy: p.random(-0.5, 0.5),
                size: p.random(8, 20),      // 大幅增大粒子尺寸
                alpha: p.random(0.3, 0.8)   // 保持較高透明度
            });

            p.draw = () => {
                p.clear();
                time += 0.01;

                if (variant === 'particles') {
                    drawParticles(p);
                } else if (variant === 'waves') {
                    drawWaves(p);
                } else if (variant === 'network') {
                    drawNetwork(p);
                }
            };

            const drawParticles = (p: p5) => {
                for (const particle of particles) {
                    // 更新位置
                    particle.x += particle.vx;
                    particle.y += particle.vy;

                    // 邊界處理
                    if (particle.x < 0 || particle.x > p.width) particle.vx *= -1;
                    if (particle.y < 0 || particle.y > p.height) particle.vy *= -1;

                    // 繪製粒子
                    p.noStroke();
                    p.fill(rgb.r, rgb.g, rgb.b, particle.alpha * opacity * 255);
                    p.ellipse(particle.x, particle.y, particle.size);
                }

                // 繪製連接線
                for (let i = 0; i < particles.length; i++) {
                    for (let j = i + 1; j < particles.length; j++) {
                        const d = p.dist(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                        if (d < 250) {  // 增加連線距離
                            const alpha = p.map(d, 0, 250, 0.8, 0);  // 增加連線透明度
                            p.stroke(rgb.r, rgb.g, rgb.b, alpha * opacity * 255);
                            p.strokeWeight(2);  // 加粗連線
                            p.line(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                        }
                    }
                }
            };

            const drawWaves = (p: p5) => {
                p.noFill();
                for (let i = 0; i < 5; i++) {
                    p.beginShape();
                    p.stroke(rgb.r, rgb.g, rgb.b, (0.1 + i * 0.05) * opacity * 255);
                    p.strokeWeight(2);

                    for (let x = 0; x <= p.width; x += 10) {
                        const y = p.height / 2 +
                            p.sin(x * 0.01 + time + i * 0.5) * 50 +
                            p.sin(x * 0.02 + time * 1.5) * 30 +
                            i * 30;
                        p.vertex(x, y);
                    }
                    p.endShape();
                }
            };

            const drawNetwork = (p: p5) => {
                const nodes: { x: number; y: number }[] = [];
                const gridSize = 80;  // 縮小網格使其更密集

                for (let x = 0; x < p.width + gridSize; x += gridSize) {
                    for (let y = 0; y < p.height + gridSize; y += gridSize) {
                        const offsetX = p.sin(time + x * 0.01) * 25;  // 增加擺動幅度
                        const offsetY = p.cos(time + y * 0.01) * 25;
                        nodes.push({ x: x + offsetX, y: y + offsetY });
                    }
                }

                // 繪製連接線
                p.stroke(rgb.r, rgb.g, rgb.b, 0.35 * opacity * 255);  // 增加連線透明度
                p.strokeWeight(1.5);  // 加粗連線
                for (let i = 0; i < nodes.length; i++) {
                    for (let j = i + 1; j < nodes.length; j++) {
                        const d = p.dist(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
                        if (d < gridSize * 1.5) {
                            p.line(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
                        }
                    }
                }

                // 繪製節點
                p.noStroke();
                p.fill(rgb.r, rgb.g, rgb.b, 0.7 * opacity * 255);  // 增加節點透明度
                for (const node of nodes) {
                    p.ellipse(node.x, node.y, 6);  // 增大節點尺寸
                }
            };

            p.windowResized = () => {
                p.resizeCanvas(p.windowWidth, p.windowHeight);
            };
        };

        p5Instance.current = new p5(sketch, containerRef.current);

        return () => {
            if (p5Instance.current) {
                p5Instance.current.remove();
            }
        };
    }, [variant, opacity, color]);

    return <div ref={containerRef} className="p5-background" />;
};

export default P5Background;
