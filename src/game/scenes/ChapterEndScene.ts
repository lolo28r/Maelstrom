import Phaser from 'phaser';
import i18n from '../../i18n';

export class ChapterEndScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ChapterEndScene' });
    }

    create() {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor('#0b0b0c');

        // Titre de fin
        this.add.text(width / 2, height * 0.15, i18n.t('act1_end.title'), {
            fontFamily: 'serif', fontSize: '32px', color: '#f4ebd0', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Message de remerciement
        this.add.text(width / 2, height * 0.25, i18n.t('act1_end.message'), {
            fontFamily: 'serif', fontSize: '18px', color: '#a89f85', align: 'center', lineSpacing: 8
        }).setOrigin(0.5);

        // Formulaire HTML intégré avec votre endpoint Formspree (xdekekde)
        const formHtml = `
            <form id="feedback-form" action="https://formspree.io/f/xdekekde" method="POST" style="
                background: rgba(18, 18, 20, 0.95);
                border: 1px solid #4a4539;
                padding: 20px;
                border-radius: 8px;
                width: 400px;
                text-align: center;
                font-family: serif;
                color: #f4ebd0;
            ">
                <h3 style="margin-top: 0; font-size: 18px; color: #d4af37;">${i18n.t('act1_end.feedback_title')}</h3>
                <textarea name="message" id="feedback-input" placeholder="${i18n.t('act1_end.feedback_placeholder')}" required style="
                    width: 100%;
                    height: 90px;
                    background: #151517;
                    border: 1px solid #332f28;
                    color: #fff;
                    padding: 8px;
                    border-radius: 4px;
                    resize: none;
                    box-sizing: border-box;
                    margin-bottom: 10px;
                "></textarea>
                <br>
                <button type="submit" id="feedback-submit" style="
                    background: #2a2520;
                    color: #f4ebd0;
                    border: 1px solid #5a5245;
                    padding: 8px 16px;
                    cursor: pointer;
                    border-radius: 4px;
                    font-family: serif;
                ">${i18n.t('act1_end.submit_btn')}</button>
                <div id="feedback-success" style="margin-top: 10px; font-size: 14px; color: #76c7c0; display: none;">
                    ${i18n.t('act1_end.success_msg')}
                </div>
            </form>
        `;

        // Ajout du formulaire HTML dans le DOM Phaser
        const element = this.add.dom(width / 2, height * 0.55).createFromHTML(formHtml);

        const domElement = element.node as HTMLFormElement;
        const form = domElement.querySelector('#feedback-form') as HTMLFormElement;
        const inputField = domElement.querySelector('#feedback-input') as HTMLTextAreaElement;
        const submitBtn = domElement.querySelector('#feedback-submit') as HTMLButtonElement;
        const successMsg = domElement.querySelector('#feedback-success') as HTMLElement;

        // Interception de l'envoi pour l'effectuer en AJAX (Fetch API)
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    inputField.value = '';
                    inputField.style.display = 'none';
                    submitBtn.style.display = 'none';
                    if (successMsg) successMsg.style.display = 'block';
                } else {
                    alert("Une erreur est survenue lors de l'envoi.");
                }
            } catch (error) {
                console.error("Erreur réseau :", error);
                alert("Impossible d'envoyer le message pour le moment.");
            }
        });

        // Bouton pour retourner au menu principal
        const menuButton = this.add.text(width / 2, height * 0.85, i18n.t('act1_end.menu_btn'), {
            fontFamily: 'monospace', fontSize: '16px', color: '#f4ebd0', backgroundColor: '#221f1b', padding: { x: 15, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        menuButton.on('pointerover', () => menuButton.setStyle({ color: '#d4af37' }));
        menuButton.on('pointerout', () => menuButton.setStyle({ color: '#f4ebd0' }));
        menuButton.on('pointerdown', () => {
            element.destroy(); // Nettoyage de l'élément HTML DOM
            this.scene.start('MainMenuScene'); // Remplacez par le nom de votre scène de menu principal
        });
    }
}