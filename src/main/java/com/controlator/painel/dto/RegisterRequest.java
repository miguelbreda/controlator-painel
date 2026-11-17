
package com.controlator.painel.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @NotBlank(message = "O nome de usuário é obrigatório")
        @Size(min = 3, max = 80, message = "O usuário deve ter entre 3 e 80 caracteres")
        String username,

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "Informe um e-mail válido")
        @Size(max = 150)
        String email,

        @NotBlank(message = "A senha é obrigatória")
        @Size(min = 12, max = 72, message = "A senha deve ter entre 12 e 72 caracteres")
        String password

) {
}
