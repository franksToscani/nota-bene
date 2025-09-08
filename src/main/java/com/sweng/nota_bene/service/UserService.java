package com.sweng.nota_bene.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.sweng.nota_bene.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public String validateUsersExist(java.util.List<String> emails) {
        for (String email : emails) {
            if (!existsByEmail(email)) {
                return email;
            }
        }
        return null;
    }
}