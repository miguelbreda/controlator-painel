package com.controlator.painel.service;

import com.controlator.painel.model.Product;
import com.controlator.painel.repository.ProductRepository;
import com.controlator.painel.repository.StockMovementRepository;
import com.controlator.painel.repository.PriceHistoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final PriceHistoryRepository priceHistoryRepository;

    public ProductService(ProductRepository productRepository,
                          StockMovementRepository stockMovementRepository,
                          PriceHistoryRepository priceHistoryRepository) {
        this.productRepository = productRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.priceHistoryRepository = priceHistoryRepository;
    }

    public List<Product> findAll() {
        return productRepository.findAllByActiveTrue();
    }

    public List<Product> findArchived() {
        return productRepository.findAllByActiveFalse();
    }

    public Product findById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));
    }

    private Product findActiveById(Long id) {
        Product product = findById(id);
        if (!Boolean.TRUE.equals(product.getActive())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este produto foi apagado e não está disponível nas listas ativas.");
        }
        return product;
    }

    @Transactional
    public Product save(Product product) {
        if (product.getCode() == null || product.getCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o código do produto.");
        }

        // If this code belongs to a previously deleted (archived) product,
        // reactivate the existing record instead of violating the unique constraint.
        Product existing = productRepository.findByCode(product.getCode().trim()).orElse(null);
        if (existing != null) {
            if (Boolean.TRUE.equals(existing.getActive())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Já existe um produto ativo com esse código.");
            }

            boolean sameDetails = existing.getName().equalsIgnoreCase(product.getName().trim())
                    && existing.getCategory().equalsIgnoreCase(product.getCategory().trim())
                    && existing.getPrice().compareTo(product.getPrice()) == 0
                    && existing.getStock().equals(product.getStock());

            if (!sameDetails) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Esse código pertence a um produto apagado com informações diferentes. " +
                        "Restaure o produto original para preservar o histórico de estoque e preços.");
            }

            existing.setActive(true);
            return productRepository.save(existing);
        }

        product.setCode(product.getCode().trim());
        product.setActive(true);
        return productRepository.save(product);
    }

    public Product update(Long id, Product updatedProduct) {
        Product product = findActiveById(id);
        if (productRepository.existsByCodeAndIdNot(updatedProduct.getCode(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe outro produto com esse código.");
        }
        // Stock and price must only be changed through their dedicated services,
        // so their histories remain consistent.
        product.setName(updatedProduct.getName());
        product.setCategory(updatedProduct.getCategory());
        product.setCode(updatedProduct.getCode());
        return productRepository.save(product);
    }

    @Transactional
    public void archive(Long id) {
        Product product = findActiveById(id);
        product.setActive(false);
        productRepository.save(product);
    }

    @Transactional
    public Product restore(Long id) {
        Product product = findById(id);
        if (Boolean.TRUE.equals(product.getActive())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este produto já está ativo.");
        }
        product.setActive(true);
        return productRepository.save(product);
    }

    @Transactional
    public void delete(Long id) {
        Product product = findById(id);
        boolean hasStockHistory = stockMovementRepository.existsByProduct_Id(id);
        boolean hasPriceHistory = priceHistoryRepository.existsByProduct_Id(id);
        if (hasStockHistory || hasPriceHistory) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este produto possui histórico e não pode ser apagado definitivamente. Use a opção Apagar para retirá-lo das listas ativas e preservar os registros.");
        }
        productRepository.delete(product);
    }
}
