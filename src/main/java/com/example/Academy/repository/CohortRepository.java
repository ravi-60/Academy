package com.example.Academy.repository;

import com.example.Academy.entity.Cohort;
import com.example.Academy.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import java.util.Optional;

@Repository
public interface CohortRepository extends JpaRepository<Cohort, Long> {

    Optional<Cohort> findByCode(String code);

    boolean existsByCode(String code);

    List<Cohort> findByCoach(User coach);
}
