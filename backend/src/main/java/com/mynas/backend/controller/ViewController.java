package com.mynas.backend.controller;

import com.mynas.backend.service.FileService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

/*The @Controller is used to handle a view. When returning a string ex:"upload" it will
    search the "templates" folder for a static file called "upload" and return that to
    the user*/

// --------------------------------------------------------------------------------------------
    /* TODO Deprecated | Remove view Controller
     No longer providing views using HTML templates. Currently Using a node.js frontend to controll
     views and User Interaction
     */
// --------------------------------------------------------------------------------------------

@Controller
@RequestMapping("/api")
public class ViewController {

    private final Path storagePath;
    private final FileService fileService;

    public ViewController(FileService fileService) {
        this.fileService = fileService;
        this.storagePath= Path.of(fileService.getRootFolder());
    }
   /*
    -- Using Thymeleaf to return a files & upload HTML file. Even though it returns
    a string, Spring-boot will treat that as a file name and return the correct
    html file as long as there is one to match in the "Templates" folder.
    */

    @GetMapping("/upload")
    public String upload() {
        return "upload";
    }

    @GetMapping("/view-files")
    public String listFiles(Model model, @RequestParam(required = false) String error) throws IOException {
        try (var stream = Files.list(storagePath)) {
            model.addAttribute("files", stream
                    .filter(Files::isRegularFile)
                    .map(path -> path.getFileName().toString())
                    .toList());
        } catch (IOException ex) {
            model.addAttribute("files", List.of());
        }

        //In case of an error.
        model.addAttribute("error", error);
        model.addAttribute("converting", fileService.isConverting());

        return "file"; // Thymeleaf view name
    }

    @GetMapping("/convert")
    @ResponseBody
    public Map<String, String> convertFile(@RequestParam String filename,
                                           @RequestParam(required = false) boolean overwrite,
                                           @RequestParam(required = false) boolean rename,
                                           @RequestParam(required = false) String newName) throws IOException {

        Path inputPath = Paths.get(fileService.getRootFolder(), filename);

        System.out.println("In the convertFile Method | FileName: " + filename + "\n " +
                "Path: " + inputPath);

        return fileService.convertIfNeeded(inputPath, overwrite, rename, newName);
    }

    @GetMapping("/watch/{filename}")
    public String watchVideo(@PathVariable String filename, Model model) {
        model.addAttribute("filename", filename);
        return "stream";
    }
}
