package com.controlator.painel.repository;

import com.controlator.painel.model.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findAllByProductIdOrderByCreatedAtDesc(Long productId);
    boolean existsByProduct_Id(Long productId);
}
