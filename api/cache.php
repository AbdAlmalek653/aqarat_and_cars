<?php
/**
 * نظام كاش بسيط وسريع (File-based Cache)
 * يحفظ نتائج الاستعلامات في ملفات JSON لتسريع الاستجابة
 */

class SimpleCache {
    private $cacheDir;
    private $defaultTTL;

    public function __construct($cacheDir = null, $defaultTTL = 300) {
        $this->cacheDir = $cacheDir ?: __DIR__ . '/../cache';
        $this->defaultTTL = $defaultTTL;
        
        if (!is_dir($this->cacheDir)) {
            @mkdir($this->cacheDir, 0777, true);
        }
    }

    public function remember($key, $callback, $ttl = null) {
        $ttl = $ttl ?: $this->defaultTTL;
        $file = $this->cacheDir . '/' . md5($key) . '.json';

        if (file_exists($file) && (time() - filemtime($file)) < $ttl) {
            $content = @file_get_contents($file);
            if ($content !== false) {
                $data = json_decode($content, true);
                if ($data !== null) return $data;
            }
        }

        $result = $callback();
        @file_put_contents($file, json_encode($result, JSON_UNESCAPED_UNICODE), LOCK_EX);
        return $result;
    }

    public function forget($key) {
        $file = $this->cacheDir . '/' . md5($key) . '.json';
        if (file_exists($file)) @unlink($file);
    }

    public function flush() {
        $files = glob($this->cacheDir . '/*.json');
        foreach ($files as $f) @unlink($f);
    }
}