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
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public UserDetailsService userDetailsService() {
        UserDetails engineer1 = User.builder()
                .username("engineer1")
                .password(passwordEncoder().encode("password1"))
                .roles("ENGINEER")
                .build();

        UserDetails engineer2 = User.builder()
                .username("engineer2")
                .password(passwordEncoder().encode("password2"))
                .roles("ENGINEER")
                .build();

        UserDetails boss = User.builder()
                .username("boss")
                .password(passwordEncoder().encode("boss123"))
                .roles("BOSS")
                .build();

        return new InMemoryUserDetailsManager(engineer1, engineer2, boss);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. Настройка доступа
                .authorizeHttpRequests(auth -> auth
                        // Разрешаем всё статическое И /login (GET и POST!)
                        .requestMatchers("/", "/login", "/css/**", "/js/**", "/images/**").permitAll()
                        // H2 Console для разработки
                        .requestMatchers("/h2-console/**").permitAll()
                        // ВСЕ остальные запросы требуют логина
                        .anyRequest().authenticated()
                )

                // 2. Ключевое: ОТКЛЮЧАЕМ стандартную форму логина Spring
                .formLogin(form -> form
                        .loginPage("/")                    // Используем главную страницу как форму логина
                        .loginProcessingUrl("/login")      // URL для обработки POST запроса
                        .defaultSuccessUrl("/applications", true)  // После успешного логина
                        .failureUrl("/?error=true")        // При ошибке
                        .usernameParameter("username")     // Имя поля логина (по умолчанию так и есть)
                        .passwordParameter("password")     // Имя поля пароля (по умолчанию так и есть)
                        .permitAll()
                )

                // 3. Отключаем CSRF для удобства тестирования (потом включить!)
                .csrf(csrf -> csrf.disable())

                // 4. Логаут
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/?logout=true")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                        .permitAll()
                )

                // 5. Для H2 Console
                .headers(headers -> headers
                        .frameOptions(frame -> frame.sameOrigin())
                );

        return http.build();
    }
}