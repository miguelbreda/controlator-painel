
package com.controlator.painel.dto;

import java.math.BigDecimal;

public record DashboardProductDTO(
        Long id,
        String name,
        String category,
        BigDecimal price,
        Integer stock
) {
}
