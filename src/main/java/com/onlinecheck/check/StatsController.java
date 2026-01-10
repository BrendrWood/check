package com.onlinecheck.check;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class StatsController {

    @GetMapping("/stats")
    public String showStatsPage() {
        return "stats"; // показывает stats.html
    }
}