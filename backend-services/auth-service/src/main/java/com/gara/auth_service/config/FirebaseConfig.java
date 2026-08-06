package com.gara.auth_service.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                String path = System.getenv("FIREBASE_SERVICE_ACCOUNT_PATH");
                if (path == null || path.isEmpty()) {
                    path = "../firebase-service-account.json"; // fallback cho local run
                }
                FileInputStream serviceAccount = new FileInputStream(path);

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();

                FirebaseApp.initializeApp(options);
                System.out.println("FirebaseApp initialized successfully");
            }
        } catch (IOException e) {
            System.err.println("Failed to initialize FirebaseApp: " + e.getMessage());
        }
    }
}
