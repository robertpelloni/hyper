package com.tormentnexus;

import java.util.HashSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.List;

public class Agent {
    private Map<String, Object> state;
    private Set<Object> listeners;
    private List<Object> steeringQueue;
    private List<Object> followUpQueue;

    public Agent() {
        this.state = new HashMap<>();
        this.listeners = new HashSet<>();
        this.steeringQueue = new ArrayList<>();
        this.followUpQueue = new ArrayList<>();
    }

    public void addListener(Object listener) {
        this.listeners.add(listener);
    }

    public void removeListener(Object listener) {
        this.listeners.remove(listener);
    }
}