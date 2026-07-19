package com.abwcurious.restaurant.crm;

import com.abwcurious.restaurant.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerRepository customerRepository;

    @GetMapping
    public ApiResponse<List<Customer>> getCustomers() {
        List<Customer> customers = customerRepository.findAll();
        return ApiResponse.success(customers);
    }

    @PostMapping
    public ApiResponse<Customer> createCustomer(
            @RequestParam String name,
            @RequestParam String phone,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Integer loyaltyPoints) {
        
        // Return existing customer if phone matched
        Customer existing = customerRepository.findByPhone(phone).orElse(null);
        if (existing != null) {
            return ApiResponse.success(existing, "Customer already exists with this phone number");
        }

        Customer customer = Customer.builder()
                .name(name)
                .phone(phone)
                .email(email)
                .loyaltyPoints(loyaltyPoints != null ? loyaltyPoints : 0)
                .build();
        Customer saved = customerRepository.save(customer);
        return ApiResponse.success(saved, "Customer created successfully");
    }

    @PostMapping("/{id}/points")
    public ApiResponse<Customer> addPoints(
            @PathVariable Long id,
            @RequestParam Integer points) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        customer.setLoyaltyPoints(customer.getLoyaltyPoints() + points);
        Customer saved = customerRepository.save(customer);
        return ApiResponse.success(saved, "Loyalty points updated successfully");
    }
}
