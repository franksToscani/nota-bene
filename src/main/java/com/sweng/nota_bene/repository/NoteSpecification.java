package com.sweng.nota_bene.repository;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

import com.sweng.nota_bene.model.Note;

import jakarta.persistence.criteria.Predicate;

public class NoteSpecification {

    private NoteSpecification() {}

    public static Specification<Note> withOwnerOrShared(String proprietarioEmail, List<UUID> sharedIds) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (proprietarioEmail != null) {
                predicates.add(cb.equal(root.get("proprietario"), proprietarioEmail));
            }
            if (sharedIds != null && !sharedIds.isEmpty()) {
                predicates.add(root.get("id").in(sharedIds));
            }
            if (predicates.isEmpty()) {
                return cb.conjunction();
            }
            return cb.or(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<Note> withSearchTerm(String searchTerm) {
        return (root, query, cb) -> {
            if (searchTerm == null || searchTerm.trim().isEmpty()) {
                return cb.conjunction();
            }
            String term = "%" + searchTerm.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("titolo")), term),
                    cb.like(cb.lower(root.get("contenuto")), term),
                    cb.like(cb.lower(root.get("tag")), term)
            );
        };
    }

    public static Specification<Note> withTag(String tag) {
        return (root, query, cb) -> {
            if (tag == null || tag.trim().isEmpty()) {
                return cb.conjunction();
            }
            return cb.equal(root.get("tag"), tag);
        };
    }

    public static Specification<Note> withCreationDateBetween(OffsetDateTime start, OffsetDateTime end) {
        return (root, query, cb) -> {
            if (start == null && end == null) {
                return cb.conjunction();
            }
            if (start != null && end != null) {
                return cb.between(root.get("dataCreazione"), start, end);
            }
            if (start != null) {
                return cb.greaterThanOrEqualTo(root.get("dataCreazione"), start);
            }
            return cb.lessThanOrEqualTo(root.get("dataCreazione"), end);
        };
    }

    public static Specification<Note> withLastModifiedDateBetween(OffsetDateTime start, OffsetDateTime end) {
        return (root, query, cb) -> {
            if (start == null && end == null) {
                return cb.conjunction();
            }
            if (start != null && end != null) {
                return cb.between(root.get("dataUltimaModifica"), start, end);
            }
            if (start != null) {
                return cb.greaterThanOrEqualTo(root.get("dataUltimaModifica"), start);
            }
            return cb.lessThanOrEqualTo(root.get("dataUltimaModifica"), end);
        };
    }
}