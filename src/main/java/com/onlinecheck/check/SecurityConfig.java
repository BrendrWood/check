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
                .password(passwordEncoder().encode("boss123"))
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
                        .requestMatchers("/", "/login", "/css/**", "/js/**", "/images/**").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/api/**").authenticated()  // API требует аутентификации
                        .anyRequest().authenticated()
                )

                .formLogin(form -> form
                        .loginPage("/")
                        .loginProcessingUrl("/login")
                        .defaultSuccessUrl("/applications", true)
                        .failureUrl("/?error=true")
                        .permitAll()
                )

                // ВАЖНО: Отключаем CSRF для REST API (обычная практика)
                .csrf(csrf -> csrf
                        .ignoringRequestMatchers("/h2-console/**", "/api/**")  // API без CSRF
                )

                .rememberMe(remember -> remember
                        .key(REMEMBER_ME_KEY)
                        .rememberMeParameter("remember-me")
                        .tokenValiditySeconds(365 * 24 * 60 * 60)
                        .userDetailsService(userDetailsService())
                )

                .logout(logout -> logout
                        .logoutUrl("/logout")
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