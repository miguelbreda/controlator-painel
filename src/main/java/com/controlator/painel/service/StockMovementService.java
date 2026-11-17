
package com.controlator.painel.service;

import com.controlator.painel.enums.StockMovementType;
import com.controlator.painel.model.Product;
import com.controlator.painel.model.StockMovement;
import com.controlator.painel.repository.ProductRepository;
import com.controlator.painel.repository.StockMovementRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class StockMovementService {

    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;

    public StockMovementService(
            ProductRepository productRepository,
            StockMovementRepository stockMovementRepository
    ) {
        this.productRepository = productRepository;
        this.stockMovementRepository = stockMovementRepository;
    }

    @Transactional
    public StockMovement registerMovement(
            Long productId,
            StockMovementType type,
            Integer quantity
    ) {

        if (quantity == null || quantity <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A quantidade deve ser maior que zero"
            );
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Produto não encontrado"
                ));

        if (type == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tipo de movimentação inválido"
            );
        }

        if (type == StockMovementType.ENTRY) {
            product.setStock(product.getStock() + quantity);
        }

        if (type == StockMovementType.EXIT) {

            if (product.getStock() < quantity) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Estoque insuficiente"
                );
            }

            product.setStock(product.getStock() - quantity);
        }

        productRepository.save(product);

        StockMovement movement = new StockMovement(
                product,
                type,
                quantity
        );

        return stockMovementRepository.save(movement);
    }

    public List<StockMovement> findByProduct(Long productId) {

        if (!productRepository.existsById(productId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Produto não encontrado"
            );
        }

        return stockMovementRepository
                .findAllByProductIdOrderByCreatedAtDesc(productId);
    }
}
