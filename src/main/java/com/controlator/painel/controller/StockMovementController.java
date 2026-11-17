
package com.controlator.painel.controller;

import com.controlator.painel.enums.StockMovementType;
import com.controlator.painel.model.StockMovement;
import com.controlator.painel.service.StockMovementService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class StockMovementController {

    private final StockMovementService stockMovementService;

    public StockMovementController(
            StockMovementService stockMovementService
    ) {
        this.stockMovementService = stockMovementService;
    }

    @PostMapping("/{id}/stock/entry")
    public StockMovement registerEntry(
            @PathVariable Long id,
            @RequestParam Integer quantity
    ) {
        return stockMovementService.registerMovement(
                id,
                StockMovementType.ENTRY,
                quantity
        );
    }

    @PostMapping("/{id}/stock/exit")
    public StockMovement registerExit(
            @PathVariable Long id,
            @RequestParam Integer quantity
    ) {
        return stockMovementService.registerMovement(
                id,
                StockMovementType.EXIT,
                quantity
        );
    }

    @GetMapping("/{id}/stock/history")
    public List<StockMovement> findHistory(
            @PathVariable Long id
    ) {
        return stockMovementService.findByProduct(id);
    }
}
