package dev.gpxmanager;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class HealthController {

    private final Flyway flyway;

    HealthController(Flyway flyway) {
        this.flyway = flyway;
    }

    record Health(String status, String schemaVersion) {}

    @GetMapping("/api/health")
    Health health() {
        MigrationInfo current = flyway.info().current();
        return new Health("UP", current == null ? null : current.getVersion().getVersion());
    }
}
