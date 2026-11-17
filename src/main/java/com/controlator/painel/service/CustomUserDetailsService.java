
package com.controlator.painel.service;

import com.controlator.painel.model.User;
import com.controlator.painel.repository.UserRepository;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String login)
            throws UsernameNotFoundException {

        String normalizedLogin = login.trim();

        User user = userRepository.findByUsername(normalizedLogin)
                .or(() -> userRepository.findByEmail(
                        normalizedLogin.toLowerCase()
                ))
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "Usuário ou e-mail não encontrado."
                        )
                );

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPassword())
                .roles(user.getRole().name())
                .disabled(!user.isActive())
                .build();
    }
}
