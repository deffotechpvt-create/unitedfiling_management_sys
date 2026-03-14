export function downloadCSV(data: any[], filename: string) {
    if (!data || !data.length) return;

    // Get headers from all object keys
    const headers = Array.from(
        new Set(data.flatMap((obj) => Object.keys(obj)))
    );

    // Filter out complex objects or map them to strings
    const rows = data.map((row) => {
        return headers.map((header) => {
            const val = row[header];
            if (val === null || val === undefined) {
                return '""';
            }
            if (typeof val === 'object') {
                // simple serialization of object (like the assignedAdmin)
                return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
            }
            return `"${String(val).replace(/"/g, '""')}"`;
        }).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
