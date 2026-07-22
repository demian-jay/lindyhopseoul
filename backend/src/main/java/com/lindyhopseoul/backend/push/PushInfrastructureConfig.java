package com.lindyhopseoul.backend.push;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Turns on the two Spring features the push feature needs: scheduling (the
 * day-before lesson reminder) and async (so post-commit push sends run off the
 * request thread).
 */
@Configuration
@EnableScheduling
@EnableAsync
public class PushInfrastructureConfig {
}
