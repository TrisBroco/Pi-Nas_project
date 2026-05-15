package com.mynas.backend.service;

import com.mynas.backend.database.User;
import com.mynas.backend.database.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository userRepository;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Long getUserId(String user){
        return userRepository.findByUsername(user)
                .map(User::getId)
                .orElse(-1L);
    }
}