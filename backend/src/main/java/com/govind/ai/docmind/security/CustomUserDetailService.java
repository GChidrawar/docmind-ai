package com.govind.ai.docmind.security;

import com.govind.ai.docmind.model.User;
import com.govind.ai.docmind.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * @author govind.chidrawar
 * @since 30-09-2026
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailService implements UserDetailsService {

    private final UserRepository userRepository;

    // Loads the user details for authentication
    @Override
    public @NonNull UserDetails loadUserByUsername(@NonNull String username) throws UsernameNotFoundException {
        Optional<User> userOptional = userRepository.findByUserName(username);
        return new CustomUserDetail(userOptional.orElseThrow(() -> new UsernameNotFoundException("Invalid username or password")));
    }

}
