package com.lindyhopseoul.backend.knowledgebase;

import java.util.List;

import com.lindyhopseoul.backend.admin.AdminSessionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class KnowledgeBaseController {

    private final AdminSessionService adminSessionService;
    private final KnowledgeBaseService knowledgeBaseService;

    public KnowledgeBaseController(
            AdminSessionService adminSessionService,
            KnowledgeBaseService knowledgeBaseService
    ) {
        this.adminSessionService = adminSessionService;
        this.knowledgeBaseService = knowledgeBaseService;
    }

    @GetMapping("/api/admin/knowledge-base/bootstrap")
    public KnowledgeBaseBootstrapResponse bootstrap(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        adminSessionService.requirePrincipal(authorization);
        return knowledgeBaseService.bootstrap();
    }

    @GetMapping("/api/admin/knowledge-categories")
    public List<KnowledgeCategoryResponse> findCategories(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        adminSessionService.requirePrincipal(authorization);
        return knowledgeBaseService.findCategories();
    }

    @PostMapping("/api/admin/knowledge-categories")
    @ResponseStatus(HttpStatus.CREATED)
    public KnowledgeCategoryResponse createCategory(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody KnowledgeCategoryRequest request
    ) {
        return knowledgeBaseService.createCategory(adminSessionService.requirePrincipal(authorization), request);
    }

    @PutMapping("/api/admin/knowledge-categories/{id}")
    public KnowledgeCategoryResponse updateCategory(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @Valid @RequestBody KnowledgeCategoryRequest request
    ) {
        return knowledgeBaseService.updateCategory(adminSessionService.requirePrincipal(authorization), id, request);
    }

    @DeleteMapping("/api/admin/knowledge-categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id
    ) {
        knowledgeBaseService.deleteCategory(adminSessionService.requirePrincipal(authorization), id);
    }

    @GetMapping("/api/admin/knowledge-items")
    public List<KnowledgeItemResponse> findItems(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        adminSessionService.requirePrincipal(authorization);
        return knowledgeBaseService.findItems();
    }

    @GetMapping("/api/admin/knowledge-items/{id}")
    public KnowledgeItemResponse findItem(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id
    ) {
        adminSessionService.requirePrincipal(authorization);
        return knowledgeBaseService.findItem(id);
    }

    @PostMapping("/api/admin/knowledge-items")
    @ResponseStatus(HttpStatus.CREATED)
    public KnowledgeItemResponse createItem(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody KnowledgeItemRequest request
    ) {
        return knowledgeBaseService.createItem(adminSessionService.requirePrincipal(authorization), request);
    }

    @PutMapping("/api/admin/knowledge-items/{id}")
    public KnowledgeItemResponse updateItem(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @Valid @RequestBody KnowledgeItemRequest request
    ) {
        return knowledgeBaseService.updateItem(adminSessionService.requirePrincipal(authorization), id, request);
    }

    @DeleteMapping("/api/admin/knowledge-items/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteItem(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id
    ) {
        knowledgeBaseService.deleteItem(adminSessionService.requirePrincipal(authorization), id);
    }
}
