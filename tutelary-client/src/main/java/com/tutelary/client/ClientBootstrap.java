package com.tutelary.client;

import cn.hutool.core.lang.UUID;
import cn.hutool.core.util.ServiceLoaderUtil;
import com.alibaba.arthas.deps.ch.qos.logback.classic.LoggerContext;
import com.tutelary.client.enhance.spy.EnhancedSpy;
import com.tutelary.client.loader.ClassLoaderWrapper;
import com.tutelary.client.util.LogUtil;
import com.tutelary.common.config.TutelaryAgentProperties;
import com.tutelary.common.log.Log;
import com.tutelary.common.log.LogFactory;
import com.tutelary.common.log.dialect.console.ConsoleLog;
import com.tutelary.event.ChannelEventListener;
import com.tutelary.event.ChannelEvents;
import com.tutelary.processor.MessageProcessor;
import com.tutelary.processor.MessageProcessorManager;

import java.io.File;
import java.lang.instrument.Instrumentation;
import java.security.CodeSource;
import java.tutelary.WeaveSpy;
import java.util.List;
import java.util.jar.JarFile;

public class ClientBootstrap {

    private static Log LOGGER = new ConsoleLog(ClientBootstrap.class);

    public static Instrumentation INSTRUMENTATION;

    public static TutelaryAgentProperties TUTELARY_AGENT_PROPERTIES;

    public static TutelaryClient client;

    public volatile static String instanceId;

    public static boolean registered = false;

    public static ChannelEvents channelEvents;

    private static LoggerContext loggerContext;

    public static void start(Instrumentation instrumentation, TutelaryAgentProperties tutelaryAgentProperties) throws Exception {
        INSTRUMENTATION = instrumentation;
        TUTELARY_AGENT_PROPERTIES = tutelaryAgentProperties;

        // init logger
        initLog(tutelaryAgentProperties);

        instanceId = UUID.randomUUID().toString(true);

        final MessageProcessorManager messageProcessorManager = new MessageProcessorManager();

        loadMessageProcessor(messageProcessorManager);

        loadCommandHandler();

        loadChannelEventListeners();

        installSyp();

        startClient(messageProcessorManager);

        connect();

        Runtime.getRuntime().addShutdownHook(new Thread(ClientBootstrap::destroy));
    }

    private static void initLog(TutelaryAgentProperties properties) {
        loggerContext = LogUtil.initLogger(properties.getTutelaryWorkspace());
        if (loggerContext != null) {
            LOGGER = LogFactory.get(ClientBootstrap.class);
        }
    }

    private static void installSyp() throws Exception {
        // 将 spy 添加到 BootstrapClassLoader
        ClassLoader parent = ClassLoader.getSystemClassLoader().getParent();
        Class<?> spyClass = null;
        if (parent != null) {
            try {
                spyClass = parent.loadClass("java.tutelary.WeaveSpy");
            } catch (Throwable e) {
            }
        }
        if (spyClass == null) {
            CodeSource codeSource = ClientBootstrap.class.getProtectionDomain().getCodeSource();
            if (codeSource != null) {
                File tutelaryClientJarFile = new File(codeSource.getLocation().toURI().getSchemeSpecificPart());
                File spyJarFile = new File(tutelaryClientJarFile.getParentFile(), "tutelary-spy.jar");
                INSTRUMENTATION.appendToBootstrapClassLoaderSearch(new JarFile(spyJarFile));
            } else {
                throw new IllegalAccessException("can not find tutelary-spy.jar");
            }
        }
        WeaveSpy.installSpy(new EnhancedSpy());
    }

    private static void loadChannelEventListeners() {
        List<ChannelEventListener> channelEventListeners = ServiceLoaderUtil.loadList(ChannelEventListener.class, ClassLoaderWrapper.getAgentClassLoader());
        channelEvents = new ChannelEvents(channelEventListeners);
    }

    private static void loadMessageProcessor(MessageProcessorManager messageProcessorManager) {
        List<MessageProcessor> messageProcessors = ServiceLoaderUtil.loadList(MessageProcessor.class, ClassLoaderWrapper.getAgentClassLoader());
        messageProcessors.forEach(messageProcessorManager::register);
    }

    private static void loadCommandHandler() {
    }

    private static void startClient(MessageProcessorManager messageProcessorManager) {
        client = new TutelaryClient(messageProcessorManager);
    }

    public static void connect() {
        client.connect();
    }

    public static void destroy() {
        LOGGER.info("Tutelary Agent Start Destroy");
        client.destroy();
        LOGGER.info("Tutelary Agent Destroyed");
    }

}