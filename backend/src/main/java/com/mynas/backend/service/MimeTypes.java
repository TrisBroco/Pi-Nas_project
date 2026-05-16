package com.mynas.backend.service;

import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.Map;

public class MimeTypes {

    private static final Map<String, String> TYPES = Map.ofEntries(
            // Video
            Map.entry("mp4",  "video/mp4"),
            Map.entry("mkv",  "video/x-matroska"),
            Map.entry("avi",  "video/x-msvideo"),
            Map.entry("mov",  "video/quicktime"),
            Map.entry("webm", "video/webm"),
            Map.entry("3gp", "video/3gpp"),
            Map.entry("3g2", "video/3gpp2"),
            Map.entry("ts", "video/mp2t"),
            Map.entry("mpeg", "video/mpeg"),
            Map.entry("ogv", "video/ogg"),

            // Audio
            Map.entry("mp3",  "audio/mpeg"),
            Map.entry("wav",  "audio/wav"),
            Map.entry("flac", "audio/flac"),
            Map.entry("aac",  "audio/aac"),
            Map.entry("mid", "audio/midi"),
            Map.entry("midi", "audio/x-midi"),
            Map.entry("oga", "audio/ogg"),
            Map.entry("opus", "audio/ogg"),
            Map.entry("weba", "audio/webm"),

            // Image
            Map.entry("jpg",  "image/jpeg"),
            Map.entry("jpeg", "image/jpeg"),
            Map.entry("png",  "image/png"),
            Map.entry("gif",  "image/gif"),
            Map.entry("webp", "image/webp"),
            Map.entry("svg",  "image/svg+xml"),
            Map.entry("apng", "image/apng"),
            Map.entry("avif", "image/avif"),
            Map.entry("bmp", "image/bmp"),
            Map.entry("tif", "image/tiff"),
            Map.entry("tiff", "image/tiff"),
            Map.entry("ico", "image/vnd.microsoft.icon"),

            // Document
            Map.entry("pdf",  "application/pdf"),
            Map.entry("txt",  "text/plain"),
            Map.entry("csv",  "text/csv"),
            Map.entry("zip",  "application/zip"),
            Map.entry("ics", "text/calendar"),
            Map.entry("css", "text/css"),
            Map.entry("xls", "application/vnd.ms-excel"),
            Map.entry("ppt", "application/vnd.ms-powerpoint"),
            Map.entry("pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
            Map.entry("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
            Map.entry("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),


            // Other
            Map.entry("stl",  "model/stl"),
            Map.entry("htm", "text/html"),
            Map.entry("html", "text/html"),
            Map.entry("mjs", "text/javascript"),
            Map.entry("js", "text/javascript"),
            Map.entry("md", "text/markdown"),

            // Application
            Map.entry("epub", "application/epub+zip"),
            Map.entry("gz", "application/gzip"),
            Map.entry("jar", "application/java-archive"),
            Map.entry("json", "application/json"),
            Map.entry("jsonld", "application/ld+json"),
            Map.entry("webmanifest", "application/manifest+json"),
            Map.entry("doc", "application/msword"),
            Map.entry("bin", "application/octet-stream"),
            Map.entry("ogx", "application/ogg"),
            Map.entry("rtf", "application/rtf"),
            Map.entry("azw", "application/vnd.amazon.ebook"),
            Map.entry("mpkg", "application/vnd.apple.installer+xml"),
            Map.entry("xul", "application/vnd.mozilla.xul+xml"),
            Map.entry("eot", "application/vnd.ms-fontobject"),
            Map.entry("odp", "application/vnd.oasis.opendocument.presentation"),
            Map.entry("ods", "application/vnd.oasis.opendocument.spreadsheet"),
            Map.entry("odt", "application/vnd.oasis.opendocument.text"),
            Map.entry("rar", "application/vnd.rar"),
            Map.entry("vsd", "application/vnd.visio"),
            Map.entry("7z", "application/x-7z-compressed"),
            Map.entry("abw", "application/x-abiword"),
            Map.entry("bz", "application/x-bzip"),
            Map.entry("bz2", "application/x-bzip2"),
            Map.entry("cda", "application/x-cdf"),
            Map.entry("csh", "application/x-csh"),
            Map.entry("arc", "application/x-freearc"),
            Map.entry("php", "application/x-httpd-php"),
            Map.entry("sh", "application/x-sh"),
            Map.entry("tar", "application/x-tar"),
            Map.entry("xhtml", "application/xhtml+xml"),
            Map.entry("xml", "application/xml")

            // Full List
            // https://www.iana.org/assignments/media-types/media-types.xhtml
    );

    public static final String FALLBACK = "application/octet-stream";

    public static String fromExtension(String extension) {
        if (extension == null || extension.isBlank()) return FALLBACK;
        return TYPES.getOrDefault(extension.toLowerCase(), FALLBACK);
    }

    // From a Path or filename — extracts extension automatically
    public static String fromPath(Path path) {
        String filename = path.getFileName().toString();
        int dot = filename.lastIndexOf(".");
        if (dot == -1) return FALLBACK;
        return fromExtension(filename.substring(dot + 1));
    }

    // From a MultipartFile — tries content type first, falls back to extension
    public static String fromMultipart(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType != null && !contentType.equals(FALLBACK)) {
            return contentType;
        }
        String name = file.getOriginalFilename();
        if (name == null) return FALLBACK;
        int dot = name.lastIndexOf(".");
        return dot == -1 ? FALLBACK : fromExtension(name.substring(dot + 1));
    }


    // Prevent instantiation — this is a utility class
    private MimeTypes() {}
}