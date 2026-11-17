package com.controlator.painel.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_history")
public class PriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal oldPrice;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal newPrice;

    @Column(nullable = false)
    private LocalDateTime changedAt;

    public PriceHistory() {
    }

    public PriceHistory(
            Product product,
            BigDecimal oldPrice,
            BigDecimal newPrice
    ) {
        this.product = product;
        this.oldPrice = oldPrice;
        this.newPrice = newPrice;
        this.changedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Product getProduct() {
        return product;
    }

    public BigDecimal getOldPrice() {
        return oldPrice;
    }

    public BigDecimal getNewPrice() {
        return newPrice;
    }

    public LocalDateTime getChangedAt() {
        return changedAt;
    }
}
