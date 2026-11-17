
package com.controlator.painel.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http

            // Controle de acesso às rotas
            .authorizeHttpRequests(auth -> auth

                // Página de login e arquivos públicos
                .requestMatchers(
                    "/login",
                    "/login.html",
                    "/css/**",
                    "/js/**",
                    "/images/**",
                    "/favicon.ico"
                ).permitAll()

                // Endpoint CSRF necessário para o formulário de login
                .requestMatchers(HttpMethod.GET, "/api/csrf").permitAll()

                // Cadastro público
                .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                .requestMatchers(HttpMethod.GET, "/register.html").permitAll()

                // Rotas exclusivas do administrador
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // Todo o restante exige autenticação
                .anyRequest().authenticated()
            )

            // Login personalizado
            .formLogin(form -> form
                .loginPage("/login.html")
                .loginProcessingUrl("/login")
                .usernameParameter("username")
                .passwordParameter("password")
                .defaultSuccessUrl("/", true)
                .failureUrl("/login.html?error")
                .permitAll()
            )

            // Logout
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login.html?logout")
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies("JSESSIONID")
                .permitAll()
            )

            // Proteção contra fixação de sessão
            .sessionManagement(session -> session
                .sessionFixation(fixation -> fixation.migrateSession())
            );

        return http.build();
    }
}
