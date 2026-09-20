<?php
require_once 'config.php';
session_destroy();
respond(['success' => true]);