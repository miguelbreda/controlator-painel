
package com.controlator.painel.controller;

import com.controlator.painel.model.PriceHistory;
import com.controlator.painel.service.PriceHistoryService;

import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class PriceHistoryController {

    private final PriceHistoryService priceHistoryService;

    public PriceHistoryController(
            PriceHistoryService priceHistoryService
    ) {
        this.priceHistoryService = priceHistoryService;
    }

    @PutMapping("/{id}/price")
    public PriceHistory updatePrice(
            @PathVariable Long id,
            @RequestParam BigDecimal newPrice
    ) {
        return priceHistoryService.updatePrice(id, newPrice);
    }

    @GetMapping("/{id}/price/history")
    public List<PriceHistory> findHistory(
            @PathVariable Long id
    ) {
        return priceHistoryService.findHistory(id);
    }
}
