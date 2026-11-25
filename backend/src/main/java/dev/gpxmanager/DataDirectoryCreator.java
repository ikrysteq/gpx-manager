package dev.gpxmanager;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.sql.DataSource;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.EnvironmentAware;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/** SQLite will not create missing parent folders, so make sure the data dir exists before the DataSource is used. */
@Component
class DataDirectoryCreator implements BeanPostProcessor, EnvironmentAware {

    private Environment environment;

    @Override
    public void setEnvironment(Environment environment) {
        this.environment = environment;
    }

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        if (bean instanceof DataSource) {
            String dataDir = environment.getRequiredProperty("gpx.data-dir");
            try {
                Files.createDirectories(Path.of(dataDir));
            } catch (IOException e) {
                throw new UncheckedIOException("Cannot create data dir " + dataDir, e);
            }
        }
        return bean;
    }
}
