<eidos-sdk>

### Base

You can directly call the global object `eidos`, which provides many APIs to fetch data. For example:

```jsx
const space = await eidos.currentSpace.table("tableId").rows.query({
  {
    title: "123"
  }
})
```

NOTE: don't use `eidos.currentSpace.<table>.rows.query` to query data unless you have been told that the table is available.

### Table

- every table has a `_id` field, you can use it to identify a record.

{{bindings}}

#### API Reference

```ts
/**
* @param filter a filter object, the key is field name, the value is field value
* @param options
* @returns
*/
query(filter?: Record<string, any>, options?: {
  viewId?: string;
  limit?: number;
  offset?: number;
  raw?: boolean;
  select?: string[];
  rawQuery?: string;
}): Promise<Record<string, any>[]>;
```

### File

- for file, you can use `eidos.currentSpace.file.upload` to upload file.
  the `publicUrl` is the file url in EFS, you can use it to access the file. it can be used in table file field.

#### API Reference

```jsx

interface IFile {
  id: string
  name: string
  path: string
  size: number
  mime: string
  publicUrl: string
  created_at?: string
  is_vectorized?: boolean // whether the file is vectorized, when file is vectorized, it will be stored in `eidos__embeddings` table
}

/**
 * Upload a file to EFS with specified parent path
 * @param fileData File data as ArrayBuffer or base64 string
 * @param fileName Original file name
 * @param mimeType File mime type
 * @param parentPath Parent path array, defaults to ["spaces", <space>, "files"]
 * @returns Uploaded file info
 */
public async upload(
  fileData: ArrayBuffer | string, // ArrayBuffer 或 base64 字符串
  fileName: string,
  mimeType: string,
  parentPath?: string[]
): Promise<IFile>;


```

</eidos-sdk>
