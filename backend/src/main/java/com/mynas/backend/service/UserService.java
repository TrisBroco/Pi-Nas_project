package com.mynas.backend.service;

import com.mynas.backend.database.User;
import com.mynas.backend.database.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    static UserRepository userRepository;

    @Autowired
    public UserService(UserRepository userRepository) {
        UserService.userRepository = userRepository;
    }

    public static Long getUserId(String  user) {
    System.out.println("getUserId()");
        Optional<User> userOpt = userRepository.findByUsername(user);
        if (userOpt.isEmpty()) {
            System.err.println("User not found: " + user);
            return -1L;
        }
        return userOpt.get().getId();
    }
}