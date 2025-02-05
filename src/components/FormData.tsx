import React, { useState, ChangeEvent, FormEvent } from "react";
import { Category, Type } from "../types/types";
import "../styles/FormData.css";
import { FormControl, InputLabel, OutlinedInput, InputAdornment, Select, MenuItem, SelectChangeEvent, TextField } from "@mui/material";

interface FormData {
  company: string;
  amount: string;
  date: string;
  category: Category;
  type: Type;
}


//TO DO: Añadir el resto de categorias en enum / componetizar e implementar el hook de api para hacer la peticion al back / añadir estilos
//Añadir el api key de la peticion a unas . env para que no quede expuesto

const BillForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    company: "",
    amount: "",
    date: "",
    category: Category.HOME,
    type: Type.EXPENSE,
  });

  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value as Category | Type | string
    });
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImage(file);
  };

  const handleScanWithAI = async () => {
    if (!image) return;
    setLoading(true);

    const formDataForAPI = new FormData();
    formDataForAPI.append("apikey", import.meta.env.VITE_OCR_API_KEY);
    formDataForAPI.append("file", image);
    formDataForAPI.append("language", "spa");

    try {
      const response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        body: formDataForAPI,
      });
      const data = await response.json();

      if (data && data.ParsedResults && data.ParsedResults.length > 0) {
        const extractedText = data.ParsedResults[0].ParsedText;

        const companyRegex = /(?:Empresa|Proveedor|Compañía|Factura de|Emisor|Vendedor)\s*[:\-]?\s*(\S(.+)?)/i;
        const companyMatch = extractedText.match(companyRegex);
        const company = companyMatch ? companyMatch[1].trim() : "";

        const amountRegex = /(?:Total|Monto|Importe|Cantidad|Precio|Pago)\s*[:$€]?\s*([\d,]+(?:\.\d{2})?)/i;
        const amountMatch = extractedText.match(amountRegex);
        const amount = amountMatch ? amountMatch[1].replace(/,/g, "") : "";

        const dateRegex = /\b(?:\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{2}[-\/]\d{2})\b/i;
        const dateMatch = extractedText.match(dateRegex);
        const date = dateMatch ? dateMatch[0] : "";

        setFormData({
          ...formData,
          company,
          amount,
          date,
        });
      }
    } catch (error) {
      console.error("Error al procesar la imagen:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const formattedDate = formData.date;

    const payload = {
      ...formData,
      userId: 1, //Take userId From auth context
      billDate: formattedDate,
      category: formData.category,
      type: formData.type,
      amount: parseInt(formData.amount.replace(',', ''), 10),
    };

    try {
      const response = await fetch("ruta del back", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const createdBill = await response.json();
        console.log("Factura creada exitosamente:", createdBill);
      } else {
        console.error("Error al crear la factura.");
      }
    } catch (error) {
      console.error("Error al enviar los datos:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="form-group">
        <TextField
          label="Compañía"
          name="company"
          value={formData.company}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          sx={{ m: 1 }}
        />
      </div>
      <FormControl fullWidth sx={{ m: 1 }}>
        <InputLabel htmlFor="outlined-adornment-amount">Amount</InputLabel>
        <OutlinedInput
          id="outlined-adornment-amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          startAdornment={<InputAdornment position="start">$</InputAdornment>}
          label="Amount"
        />
      </FormControl>
      <div className="form-group">
        <TextField
          label="Fecha y Hora"
          type="datetime-local"
          name="date"
          value={formData.date}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          sx={{ m: 1 }}
          InputLabelProps={{
            shrink: true,
          }}
        />
      </div>
      <div className="form-group">
        <FormControl fullWidth sx={{ m: 1 }}>
          <InputLabel id="category-select-label">Categoría</InputLabel>
          <Select
            labelId="category-select-label"
            id="category-select"
            name="category"
            value={formData.category}
            onChange={handleCategoryChange}
            label="Categoría"
          >
            {Object.values(Category).map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      <div className="form-group">
        <FormControl fullWidth sx={{ m: 1 }}>
          <InputLabel id="type-select-label">Tipo</InputLabel>
          <Select
            labelId="type-select-label"
            id="type-select"
            name="type"
            value={formData.type}
            onChange={handleTypeChange}
            label="Tipo"
          >
            {Object.values(Type).map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      <div className="button-group">
        <button type="button" onClick={handleScanWithAI} className="form-button scan-button" disabled={loading}>
          {loading ? "Escaneando..." : "Escanear con IA"}
        </button>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="form-input file-input"
          id="file-input"
        />
        <label htmlFor="file-input" className="form-button file-label">
          Seleccionar archivo
        </label>
      </div>
      <div className="submit-button-container">
        <button type="submit" className="form-button submit-button">
          Enviar
        </button>
      </div>
    </form>
  );
};

export default BillForm;