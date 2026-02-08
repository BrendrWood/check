package com.onlinecheck.check;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String REMEMBER_ME_KEY = "online-check-secret-key-2026";

    @Bean
    public UserDetailsService userDetailsService() {
        UserDetails kholmikangas = User.builder()
                .username("kholmikangas")
                .password(passwordEncoder().encode("onlinecheck1"))
                .roles("ENGINEER")
                .build();

        UserDetails bystryukov = User.builder()
                .username("bystryukov")
                .password(passwordEncoder().encode("onlinecheck2"))
                .roles("ENGINEER")
                .build();

        UserDetails tebin = User.builder()
                .username("tebin")
                .password(passwordEncoder().encode("onlinecheck3"))
                .roles("ENGINEER")
                .build();

        UserDetails guest = User.builder()
                .username("guest")
                .password(passwordEncoder().encode("onlinecheck4"))
                .roles("ENGINEER")
                .build();

        UserDetails balakin = User.builder()
                .username("balakin")
                .password(passwordEncoder().encode("boss321"))
                .roles("BOSS")
                .build();

        return new InMemoryUserDetailsManager(kholmikangas, bystryukov, tebin, guest, balakin);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(auth -> auth
                        // Разрешаем доступ без аутентификации
                        .requestMatchers(
                                "/", 
                                "/login", 
                                "/css/**", 
                                "/js/**", 
                                "/images/**",
                                "/webjars/**",
                                "/h2-console/**"
                        ).permitAll()
                        
                        // API требует аутентификации
                        .requestMatchers("/api/**").authenticated()
                        
                        // Страница приложения доступна всем аутентифицированным пользователям
                        .requestMatchers("/applications/**").authenticated()
                        
                        .anyRequest().authenticated()
                )

                .formLogin(form -> form
                        .loginPage("/")  // Главная страница = страница логина
                        .loginProcessingUrl("/perform_login")  // Изменяем URL для обработки логина
                        .defaultSuccessUrl("/applications", true)  // После успешного логина -> /applications
                        .failureUrl("/?error=true")
                        .permitAll()
                )

                // Отключаем CSRF для REST API и H2 console
                .csrf(csrf -> csrf
                        .ignoringRequestMatchers("/h2-console/**", "/api/**")
                )

                .rememberMe(remember -> remember
                        .key(REMEMBER_ME_KEY)
                        .rememberMeParameter("remember-me")
                        .tokenValiditySeconds(365 * 24 * 60 * 60)
                        .userDetailsService(userDetailsService())
                )

                .logout(logout -> logout
                        .logoutUrl("/perform_logout")
                        .logoutSuccessUrl("/?logout=true")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID", "remember-me")
                        .permitAll()
                )

                .headers(headers -> headers
                        .frameOptions(frame -> frame.sameOrigin())
                );

        return http.build();
    }
}
