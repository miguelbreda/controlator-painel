
package com.controlator.painel.service;

import com.controlator.painel.model.Product;
import com.controlator.painel.model.PriceHistory;
import com.controlator.painel.repository.ProductRepository;
import com.controlator.painel.repository.PriceHistoryRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PriceHistoryService {

    private final ProductRepository productRepository;
    private final PriceHistoryRepository priceHistoryRepository;

    public PriceHistoryService(
            ProductRepository productRepository,
            PriceHistoryRepository priceHistoryRepository
    ) {
        this.productRepository = productRepository;
        this.priceHistoryRepository = priceHistoryRepository;
    }

    @Transactional
    public PriceHistory updatePrice(Long productId, BigDecimal newPrice) {

        if (newPrice == null || newPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O preço deve ser maior que zero"
            );
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Produto não encontrado"
                ));

        BigDecimal oldPrice = product.getPrice();

        if (oldPrice.compareTo(newPrice) == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O novo preço é igual ao preço atual"
            );
        }

        PriceHistory history = new PriceHistory(
                product,
                oldPrice,
                newPrice
        );

        product.setPrice(newPrice);

        productRepository.save(product);

        return priceHistoryRepository.save(history);
    }

    public List<PriceHistory> findHistory(Long productId) {

        if (!productRepository.existsById(productId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Produto não encontrado"
            );
        }

        return priceHistoryRepository
                .findAllByProductIdOrderByChangedAtDesc(productId);
    }
}
