package com.controlator.painel.controller;

import com.controlator.painel.model.Product;
import com.controlator.painel.service.ProductService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<Product> findAll() { return productService.findAll(); }

    @GetMapping("/archived")
    public List<Product> findArchived() { return productService.findArchived(); }

    @GetMapping("/{id}")
    public Product findById(@PathVariable Long id) { return productService.findById(id); }

    @PostMapping
    public Product create(@RequestBody Product product) { return productService.save(product); }

    @PutMapping("/{id}")
    public Product update(@PathVariable Long id, @RequestBody Product product) {
        return productService.update(id, product);
    }

    @PatchMapping("/{id}/archive")
    public void archive(@PathVariable Long id) { productService.archive(id); }

    @PatchMapping("/{id}/restore")
    public Product restore(@PathVariable Long id) { return productService.restore(id); }

    // Permanent deletion is allowed only when no history references the product.
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { productService.delete(id); }
}
