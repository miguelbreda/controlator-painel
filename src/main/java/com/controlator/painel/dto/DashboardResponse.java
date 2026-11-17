
package com.controlator.painel.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardResponse(
        Long totalProducts,
        Long totalUnits,
        BigDecimal totalInventoryValue,
        Long lowStockCount,
        List<DashboardProductDTO> lowStockProducts
) {
}
