package com.controlator.painel.service;

import com.controlator.painel.dto.DashboardProductDTO;
import com.controlator.painel.dto.DashboardResponse;
import com.controlator.painel.model.Product;
import com.controlator.painel.repository.ProductRepository;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;

@Service
public class DashboardService {
    private static final int LOW_STOCK_LIMIT = 5;
    private final ProductRepository productRepository;

    public DashboardService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public DashboardResponse getDashboard() {
        List<Product> products = productRepository.findAllByActiveTrue();
        Long totalProducts = (long) products.size();
        Long totalUnits = products.stream().mapToLong(Product::getStock).sum();
        BigDecimal totalInventoryValue = products.stream()
                .map(product -> product.getPrice().multiply(BigDecimal.valueOf(product.getStock())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        List<DashboardProductDTO> lowStockProducts = products.stream()
                .filter(product -> product.getStock() <= LOW_STOCK_LIMIT)
                .map(product -> new DashboardProductDTO(product.getId(), product.getName(),
                        product.getCategory(), product.getPrice(), product.getStock()))
                .toList();
        return new DashboardResponse(totalProducts, totalUnits, totalInventoryValue,
                (long) lowStockProducts.size(), lowStockProducts);
    }
}
