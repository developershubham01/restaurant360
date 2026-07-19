package com.abwcurious.restaurant.saas;

import lombok.Data;

@Data
public class RestaurantUpdateRequest {
    private String restaurantName;
    private String ownerName;
    private String ownerEmail;
    private String ownerMobile;
    private String gstNumber;
    private String panNumber;
    private String address;
    private String city;
    private String state;
    private String country;
    private String pinCode;
    private String currency;
    private String timezone;
    private String logoUrl;
    private Integer maxUsersAllowed;
    private Integer maxBranchesAllowed;
}
