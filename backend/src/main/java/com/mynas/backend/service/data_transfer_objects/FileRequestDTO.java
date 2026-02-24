package com.mynas.backend.service.data_transfer_objects;

import lombok.Getter;

import java.util.List;

//TODO convert to a record
public class FileRequestDTO {
    @Getter
    private String user;
    @Getter
    private List<String> folders;  // can be empty
    @Getter
    private String filename;
}
