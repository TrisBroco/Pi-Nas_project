package com.mynas.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import lombok.Getter;
import lombok.Setter;

@Component
public class AppSettings {

    @Setter
    @Getter
    @Value("${app.registration-open:false}")
    private boolean registrationOpen;
}