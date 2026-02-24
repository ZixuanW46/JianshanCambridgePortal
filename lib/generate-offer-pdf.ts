import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Generate and download an Offer Letter PDF from a rendered HTML element.
 * Uses html2canvas to capture the element as a high-res image,
 * then embeds it into a jsPDF document sized to A4.
 */
export async function generateOfferPdf(
    element: HTMLElement,
    studentName: string
): Promise<void> {
    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdfWidth = 210;
    const pdfHeight = 297;

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    if (imgHeight > pdfHeight) {
        const scaledWidth = (canvas.width * pdfHeight) / canvas.height;
        const offsetX = (pdfWidth - scaledWidth) / 2;
        pdf.addImage(imgData, "PNG", offsetX, 0, scaledWidth, pdfHeight);
    } else {
        const offsetY = (pdfHeight - imgHeight) / 2;
        pdf.addImage(imgData, "PNG", 0, offsetY, imgWidth, imgHeight);
    }

    const safeName = studentName || "Applicant";
    pdf.save(`Jianshan_Offer_Letter_${safeName}.pdf`);
}
