package com.exam.system.config;

import com.exam.system.entity.User;
import com.exam.system.repository.UserRepository;
import com.exam.system.service.AuthService;
import com.exam.system.service.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

/**
 * Spring Security 配置
 * 整合 Google OAuth2 登入
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
        private static final String OAUTH_RETURN_TO_COOKIE = "oauth_return_to";

        private final UserRepository userRepository;
        private final JwtService jwtService;
        private final AuthService authService;
        /** WebSocket 與 HTTP CORS 允許的來源清單（由 ExamProperties 統一管理） */
        private final ExamProperties examProperties;

        @Value("${app.frontend.url:http://localhost:5173}")
        private String frontendUrl;

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .csrf(AbstractHttpConfigurer::disable)
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                // 公開 API - 無需認證
                                                .requestMatchers("/", "/login", "/error", "/favicon.ico", "/index.html",
                                                                "/assets/**", "/*.svg", "/*.css", "/*.js", "/*.png",
                                                                "/*.jpg")
                                                .permitAll()
                                                // 前端路由 - 交由前端處理認證
                                                .requestMatchers("/instructor/**", "/student/**", "/surveys/**",
                                                                "/emails/**", "/leaderboard/**")
                                                .permitAll()
                                                .requestMatchers("/api/auth/**").permitAll()
                                                .requestMatchers("/api/exams/join/**").permitAll()
                                                .requestMatchers("/api/exams/*/join").permitAll()
                                                .requestMatchers("/api/exams/*/questions/**").permitAll()
                                                .requestMatchers("/api/students/**").permitAll()
                                                .requestMatchers("/api/answers/**").permitAll()
                                                .requestMatchers("/api/survey-fields/**").permitAll()
                                                .requestMatchers("/api/locations/**").permitAll()
                                                .requestMatchers("/api/session/**").permitAll()
                                                // 名單中心使用獨立 integration token，Controller 仍會再次驗證。
                                                .requestMatchers("/api/integrations/audience-export").permitAll()
                                                .requestMatchers("/ws/**").permitAll()
                                                .requestMatchers("/h2-console/**").permitAll()
                                                // OPTIONS 請求允許（CORS preflight）
                                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                                // 講師專用 API - 需要 INSTRUCTOR 或 ADMIN 角色
                                                .requestMatchers("/api/exams/create").hasAnyRole("INSTRUCTOR", "ADMIN")
                                                .requestMatchers("/api/exams/*/edit").hasAnyRole("INSTRUCTOR", "ADMIN")
                                                .requestMatchers("/api/exams/*/delete")
                                                .hasAnyRole("INSTRUCTOR", "ADMIN")
                                                .requestMatchers("/api/images/upload").hasAnyRole("INSTRUCTOR", "ADMIN")
                                                .requestMatchers("/api/roles/**").hasRole("ADMIN")
                                                // 配額查詢 — 講師或管理員
                                                .requestMatchers("/api/quota/**").hasAnyRole("INSTRUCTOR", "ADMIN")
                                                // 管理員專用 API
                                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                                // 其他 API 需要認證
                                                .anyRequest().authenticated())
                                .oauth2Login(oauth2 -> oauth2
                                                .userInfoEndpoint(userInfo -> userInfo.userService(oauth2UserService()))
                                                .successHandler((request, response, authentication) -> {
                                                        try {
                                                                OAuth2User oauth2User = (OAuth2User) authentication
                                                                                .getPrincipal();
                                                                String email = oauth2User.getAttribute("email");
                                                                String googleId = oauth2User.getAttribute("sub");
                                                                String name = oauth2User.getAttribute("name");
                                                                String avatarUrl = oauth2User.getAttribute("picture");

                                                                User user = authService.resolveOrBindGoogleUser(
                                                                                email,
                                                                                name,
                                                                                googleId,
                                                                                avatarUrl);

                                                                // 產生 JWT Token
                                                                String token = jwtService.generateToken(user);
                                                                String returnTo = extractOAuthReturnTarget(request);
                                                                clearOAuthReturnTargetCookie(response);
                                                                // 重導向至前端並帶上 token
                                                                String redirectUrl = frontendUrl + "/auth/callback?token="
                                                                                + URLEncoder.encode(token,
                                                                                                StandardCharsets.UTF_8)
                                                                                + "&returnTo="
                                                                                + URLEncoder.encode(returnTo,
                                                                                                StandardCharsets.UTF_8);
                                                                response.sendRedirect(redirectUrl);
                                                        } catch (Exception ex) {
                                                                String redirectUrl = frontendUrl + "/login?error="
                                                                                + URLEncoder.encode(ex.getMessage(),
                                                                                                StandardCharsets.UTF_8);
                                                                response.sendRedirect(redirectUrl);
                                                        }
                                                })
                                                .failureHandler((request, response, exception) -> {
                                                        String redirectUrl = frontendUrl + "/login?error=" +
                                                                        URLEncoder.encode(exception.getMessage(),
                                                                                        StandardCharsets.UTF_8);
                                                        response.sendRedirect(redirectUrl);
                                                }))
                                .exceptionHandling(ex -> ex
                                                .authenticationEntryPoint((request, response, authException) -> {
                                                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                                                        response.setContentType("application/json");
                                                        response.getWriter()
                                                                        .write("{\"error\":\"Unauthorized\",\"message\":\"Please login first\"}");
                                                }))
                                .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
                                // 允許 H2 Console 的 frame
                                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()));

                return http.build();
        }

        @Bean
        public JwtAuthenticationFilter jwtAuthenticationFilter() {
                return new JwtAuthenticationFilter(jwtService, userRepository);
        }

        @Bean
        public OAuth2UserService<OAuth2UserRequest, OAuth2User> oauth2UserService() {
                return new DefaultOAuth2UserService();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                // 合併 ExamProperties 中的允許來源（含 EXAM_WEBSOCKET_ALLOWED_ORIGINS_0 注入的生產域名）
                // 與前端 URL（APP_FRONTEND_URL），確保 Security CORS 與 WebSocketConfig/CorsConfig 行為一致
                List<String> origins = new java.util.ArrayList<>(examProperties.getWebsocket().getAllowedOrigins());
                if (!origins.contains(frontendUrl)) {
                        origins.add(frontendUrl);
                }
                configuration.setAllowedOrigins(origins);
                configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
                configuration.setAllowedHeaders(List.of("*"));
                configuration.setExposedHeaders(List.of("Authorization"));
                configuration.setAllowCredentials(true);
                configuration.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }

        /**
         * 從後端 cookie 讀取 OAuth 返回頁
         */
        private String extractOAuthReturnTarget(HttpServletRequest request) {
                if (request.getCookies() == null) {
                        return "/";
                }

                for (Cookie cookie : request.getCookies()) {
                        if (OAUTH_RETURN_TO_COOKIE.equals(cookie.getName())) {
                                try {
                                        String decoded = java.net.URLDecoder.decode(cookie.getValue(),
                                                        StandardCharsets.UTF_8);
                                        return decoded == null || decoded.isBlank() ? "/" : decoded;
                                } catch (Exception ignored) {
                                        return "/";
                                }
                        }
                }

                return "/";
        }

        /**
         * 清除後端保存的 OAuth 返回頁 cookie
         */
        private void clearOAuthReturnTargetCookie(HttpServletResponse response) {
                Cookie cookie = new Cookie(OAUTH_RETURN_TO_COOKIE, "");
                cookie.setHttpOnly(true);
                cookie.setPath("/");
                cookie.setMaxAge(0);
                response.addCookie(cookie);
        }
}
