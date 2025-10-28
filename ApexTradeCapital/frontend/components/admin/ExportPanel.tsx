import React from 'react';
import { useAppContext } from '../../context/AppContext';

type CsvTable = 'users' | 'investments' | 'uploads' | 'logs';
type PdfReport = 'all' | 'byUser' | 'byDate';

const ExportPanel = () => {
    const { t, token } = useAppContext();

    const handleExport = (format: 'csv' | 'pdf', type: CsvTable | PdfReport, options?: any) => {
        if (!token) return;

        console.log(`MOCK: Generating ${format} export for ${type}`);

        // MOCK: Generate file content locally instead of fetching from an API.
        let mockContent = '';
        let mimeType = '';

        if (format === 'csv') {
            mockContent = `id,name,value\n1,mock_data_for_${type},123\n2,another_row,456`;
            mimeType = 'text/csv;charset=utf-8;';
        } else {
            // Generating a real PDF is complex, so we create a simple text file as a placeholder.
            mockContent = `This is a mock PDF report for the '${type}' category.\n\nGenerated at: ${new Date().toLocaleString()}`;
            mimeType = 'text/plain;charset=utf-8;';
        }

        try {
            const blob = new Blob([mockContent], { type: mimeType });
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            // Use .txt for the mock PDF for clarity
            const extension = format === 'pdf' ? 'txt' : format;
            a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.${extension}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (e) {
            console.error("Export failed:", e);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg max-w-2xl space-y-6">
            <div>
                <h2 className="text-xl font-bold mb-4">{t('export_csv')}</h2>
                <div className="flex flex-wrap gap-4">
                    <button onClick={() => handleExport('csv', 'users')} className="bg-brand-blue text-white font-bold py-2 px-4 rounded-lg">Users</button>
                    <button onClick={() => handleExport('csv', 'investments')} className="bg-brand-blue text-white font-bold py-2 px-4 rounded-lg">Investments</button>
                    <button onClick={() => handleExport('csv', 'uploads')} className="bg-brand-blue text-white font-bold py-2 px-4 rounded-lg">Uploads</button>
                    <button onClick={() => handleExport('csv', 'logs')} className="bg-brand-blue text-white font-bold py-2 px-4 rounded-lg">Logs</button>
                </div>
            </div>
            <div>
                <h2 className="text-xl font-bold mb-4">{t('export_pdf')}</h2>
                <div className="flex flex-wrap gap-4">
                    <button onClick={() => handleExport('pdf', 'all')} className="bg-brand-gold text-brand-charcoal font-bold py-2 px-4 rounded-lg">{t('full_report')}</button>
                    {/* Add inputs for byUser/byDate later */}
                </div>
            </div>
        </div>
    );
};

export default ExportPanel;
