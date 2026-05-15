/* eslint-disable @typescript-eslint/no-explicit-any */

export class Trie {
    root: TrieNode;
    constructor() {
        this.root = new TrieNode();
    }

    insert(item: any) {
        // Index by name, split into words so "Total Body" matches "body" too
        const words = item.name.toLowerCase().split(/[\s\-_.\/]+/);

        for (const word of words) {
            let node = this.root;
            for (const char of word) {
                if (!node.children[char]) {
                    node.children[char] = new TrieNode();
                }
                node = node.children[char];
                // Store the item at every node along the path
                if (!node.results.find(r => r.id === item.id)) {
                    node.results.push(item);
                }
            }
        }
    }

    search(prefix: string) {
        if (!prefix || prefix.trim() === "") return [];
        const lower = prefix.toLowerCase().trim();
        let node = this.root;

        for (const char of lower) {
            if (!node.children[char]) return []; // no matches
            node = node.children[char];
        }

        return node.results; // everything under this prefix
    }

    static build(files: any[], folders: any[]) {
        const trie = new Trie();
        // Tag each item with its type so the UI can distinguish
        for (const file of files) trie.insert({ ...file, _type: "file" });
        for (const folder of folders) trie.insert({ ...folder, _type: "folder" });
        return trie;
    }
}
export class TrieNode {
    children: Record<string, TrieNode>;
    results: any[];

    constructor() {
        this.children = {};
        this.results = []; // stores matching file/folder objects at this node
    }
}