
package com.controlator.painel.config;

import com.controlator.painel.enums.Role;
import com.controlator.painel.model.User;
import com.controlator.painel.repository.UserRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AdminBootstrap implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${controlator.bootstrap-admin.enabled:false}")
    private boolean enabled;

    @Value("${controlator.bootstrap-admin.username:}")
    private String username;

    @Value("${controlator.bootstrap-admin.email:}")
    private String email;

    @Value("${controlator.bootstrap-admin.password:}")
    private String password;

    public AdminBootstrap(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {

        System.out.println(">>> ADMIN BOOTSTRAP INICIADO!");
        System.out.println(">>> Bootstrap habilitado: " + enabled);
        System.out.println(">>> Username configurado: "
                + (username != null && !username.isBlank()));
        System.out.println(">>> Email configurado: "
                + (email != null && !email.isBlank()));
        System.out.println(">>> Senha configurada: "
                + (password != null && !password.isBlank()));

        if (!enabled) {
            System.out.println(">>> Bootstrap desativado.");
            return;
        }

        if (userRepository.existsByRole(Role.ADMIN)) {
            System.out.println(">>> Já existe um ADMIN.");
            return;
        }

        if (username == null || username.isBlank()
                || email == null || email.isBlank()
                || password == null || password.length() < 12
                || password.getBytes(
                    java.nio.charset.StandardCharsets.UTF_8
                ).length > 72) {

            throw new IllegalStateException(
                "Credenciais do ADMIN inválidas ou ausentes."
            );
        }

        String normalizedUsername = username.trim();
        String normalizedEmail = email.trim().toLowerCase();

        if (userRepository.existsByUsername(normalizedUsername)
                || userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalStateException(
                "Username ou e-mail já pertence a outra conta."
            );
        }

        User admin = new User();
        admin.setUsername(normalizedUsername);
        admin.setEmail(normalizedEmail);
        admin.setPassword(passwordEncoder.encode(password));
        admin.setRole(Role.ADMIN);
        admin.setActive(true);

        userRepository.save(admin);

        System.out.println(">>> CONTA ADMIN CRIADA COM SUCESSO!");
    }
}
