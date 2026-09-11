<?php
/**
 * Plugin Name: Menu Flutuante - Hospital Ocular de Sergipe
 * Plugin URI: https://hospitalocular.com.br
 * Description: Menu flutuante elegante no rodapé do site, com a identidade visual do Hospital Ocular de Sergipe. Totalmente customizável pelo painel.
 * Version: 1.0
 * Author: Nunes Soluções
 */

if (!defined('ABSPATH')) {
    exit; // Impede acesso direto ao arquivo
}

// 0. Valores padrão (já configurados com a marca do Hospital Ocular de Sergipe)
function hofm_default_value($key) {
    $defaults = [
        'hofm_link_1_text'      => 'Médicos',
        'hofm_link_2_text'      => 'Serviços',
        'hofm_link_3_text'      => 'Convênios',
        'hofm_cta_text'         => 'Pré Agendar',
        'hofm_bg_color'         => '#ffffff',
        'hofm_link_color'       => '#154a90',
        'hofm_divider_color'    => '#1cb4c9',
        'hofm_cta_bg_color'     => '#18b6c9',
        'hofm_cta_bg_color_2'   => '#154a90',
        'hofm_cta_text_color'   => '#ffffff',
    ];
    return isset($defaults[$key]) ? $defaults[$key] : '';
}
function hofm_opt($key) {
    return get_option($key, hofm_default_value($key));
}

// 1. Registrar o menu no painel administrativo
add_action('admin_menu', 'hofm_add_admin_menu');
function hofm_add_admin_menu() {
    add_menu_page(
        'Menu Flutuante',
        'Menu Flutuante',
        'manage_options',
        'hospital-ocular-floating-menu',
        'hofm_admin_page_layout',
        'dashicons-menu-alt',
        100
    );
}

// 2. Registrar as configurações (campos do banco de dados)
add_action('admin_init', 'hofm_register_settings');
function hofm_register_settings() {
    $fields = [
        'hofm_logo_img', 'hofm_logo_url',
        'hofm_link_1_text', 'hofm_link_1_url', 'hofm_link_1_hide_mobile',
        'hofm_link_2_text', 'hofm_link_2_url', 'hofm_link_2_hide_mobile',
        'hofm_link_3_text', 'hofm_link_3_url', 'hofm_link_3_hide_mobile',
        'hofm_link_4_text', 'hofm_link_4_url', 'hofm_link_4_hide_mobile',
        'hofm_link_5_text', 'hofm_link_5_url', 'hofm_link_5_hide_mobile',
        'hofm_cta_text', 'hofm_cta_url',
        'hofm_bg_color', 'hofm_link_color', 'hofm_divider_color',
        'hofm_cta_bg_color', 'hofm_cta_bg_color_2', 'hofm_cta_text_color'
    ];

    foreach ($fields as $field) {
        register_setting('hofm_settings_group', $field);
    }
}

// 3. Carregar scripts necessários para o botão de Upload de Imagem e Color Picker
add_action('admin_enqueue_scripts', 'hofm_admin_scripts');
function hofm_admin_scripts($hook) {
    if ($hook != 'toplevel_page_hospital-ocular-floating-menu') {
        return;
    }
    wp_enqueue_media();
    wp_enqueue_style('wp-color-picker');
    wp_enqueue_script('wp-color-picker');
}

// 4. Interface visual da página de configurações no painel
function hofm_admin_page_layout() {
    ?>
    <div class="wrap" style="max-width: 800px; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-top: 20px;">
        <h1>Configurações do Menu Flutuante</h1>
        <p>O menu já vem pré-configurado com as cores e os textos do Hospital Ocular de Sergipe. Faça o upload da logo abaixo e ajuste o que precisar.</p>

        <form method="post" action="options.php">
            <?php settings_fields('hofm_settings_group'); ?>
            <?php do_settings_sections('hofm_settings_group'); ?>

            <!-- Bloco de Cores -->
            <h3>Cores do Menu</h3>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row">Cor de Fundo do Menu</th>
                    <td><input type="text" name="hofm_bg_color" value="<?php echo esc_attr(hofm_opt('hofm_bg_color')); ?>" class="hofm-color-picker" data-default-color="<?php echo esc_attr(hofm_default_value('hofm_bg_color')); ?>" /></td>
                </tr>
                <tr valign="top">
                    <th scope="row">Cor do Texto (Links Centrais)</th>
                    <td><input type="text" name="hofm_link_color" value="<?php echo esc_attr(hofm_opt('hofm_link_color')); ?>" class="hofm-color-picker" data-default-color="<?php echo esc_attr(hofm_default_value('hofm_link_color')); ?>" /></td>
                </tr>
                <tr valign="top">
                    <th scope="row">Cor dos Divisores</th>
                    <td><input type="text" name="hofm_divider_color" value="<?php echo esc_attr(hofm_opt('hofm_divider_color')); ?>" class="hofm-color-picker" data-default-color="<?php echo esc_attr(hofm_default_value('hofm_divider_color')); ?>" /></td>
                </tr>
                <tr valign="top">
                    <th scope="row">Gradiente do Botão CTA (Cor Inicial)</th>
                    <td><input type="text" name="hofm_cta_bg_color" value="<?php echo esc_attr(hofm_opt('hofm_cta_bg_color')); ?>" class="hofm-color-picker" data-default-color="<?php echo esc_attr(hofm_default_value('hofm_cta_bg_color')); ?>" /></td>
                </tr>
                <tr valign="top">
                    <th scope="row">Gradiente do Botão CTA (Cor Final)</th>
                    <td><input type="text" name="hofm_cta_bg_color_2" value="<?php echo esc_attr(hofm_opt('hofm_cta_bg_color_2')); ?>" class="hofm-color-picker" data-default-color="<?php echo esc_attr(hofm_default_value('hofm_cta_bg_color_2')); ?>" /></td>
                </tr>
                <tr valign="top">
                    <th scope="row">Cor do Texto (Botão CTA)</th>
                    <td><input type="text" name="hofm_cta_text_color" value="<?php echo esc_attr(hofm_opt('hofm_cta_text_color')); ?>" class="hofm-color-picker" data-default-color="<?php echo esc_attr(hofm_default_value('hofm_cta_text_color')); ?>" /></td>
                </tr>
            </table>

            <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;">

            <!-- Bloco do Logo -->
            <h3>1. Logo (Primeiro Item)</h3>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row">Imagem do Logo</th>
                    <td>
                        <input type="text" id="hofm_logo_img" name="hofm_logo_img" value="<?php echo esc_attr(get_option('hofm_logo_img')); ?>" style="width: 70%;" />
                        <button type="button" id="hofm_upload_button" class="button button-secondary">Escolher Imagem</button>
                        <br>
                        <img id="hofm_logo_preview" src="<?php echo esc_url(get_option('hofm_logo_img')); ?>" style="max-width: 160px; margin-top: 10px; background: #f2f6f8; padding: 8px; border-radius: 8px; display: <?php echo get_option('hofm_logo_img') ? 'block' : 'none'; ?>;" />
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row">Link do Logo</th>
                    <td><input type="url" name="hofm_logo_url" value="<?php echo esc_attr(get_option('hofm_logo_url')); ?>" style="width: 100%;" placeholder="Ex: https://hospitalocular.com.br/" /></td>
                </tr>
            </table>

            <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;">

            <!-- Bloco dos Links Centrais -->
            <h3>2. Links Centrais (Máx. 5)</h3>
            <p>Gerencie os links exibidos no centro do menu. No celular, o menu vira uma grade com a logo, o CTA e até 3 links — use "Ocultar no celular" se tiver mais de 3 e quiser escolher quais aparecem lá.</p>
            <table class="form-table" id="hofm-links-table">
                <?php for($i = 1; $i <= 5; $i++):
                    $text = hofm_opt('hofm_link_'.$i.'_text');
                    $url = get_option('hofm_link_'.$i.'_url');
                    $hide_mobile = hofm_opt('hofm_link_'.$i.'_hide_mobile');
                    // Exibe a primeira linha ou qualquer linha que já tenha conteúdo salvo
                    $is_hidden = ($i > 3 && empty($text) && empty($url)) ? 'display: none;' : '';
                ?>
                <tr valign="top" class="hofm-link-row" id="row-<?php echo $i; ?>" style="<?php echo $is_hidden; ?>">
                    <th scope="row">Link <?php echo $i; ?></th>
                    <td>
                        <input type="text" name="hofm_link_<?php echo $i; ?>_text" value="<?php echo esc_attr($text); ?>" placeholder="Texto (ex: Médicos)" style="width: 35%; margin-right: 2%;" />
                        <input type="url" name="hofm_link_<?php echo $i; ?>_url" value="<?php echo esc_attr($url); ?>" placeholder="URL do Link" style="width: 45%; margin-right: 2%;" />
                        <button type="button" class="button button-link-delete hofm-remove-btn" data-row="<?php echo $i; ?>" style="color: #d63638;">Excluir</button>
                        <br>
                        <label style="display:inline-block; margin-top: 6px; font-size: 12px; color: #555;">
                            <input type="checkbox" name="hofm_link_<?php echo $i; ?>_hide_mobile" value="1" <?php checked($hide_mobile, '1'); ?> />
                            Ocultar no celular
                        </label>
                    </td>
                </tr>
                <?php endfor; ?>
            </table>
            <button type="button" class="button button-primary" id="hofm-add-btn" style="margin-top: 10px;">+ Adicionar Link</button>

            <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;">

            <!-- Bloco do Call to Action -->
            <h3>3. Botão de Destaque (Call to Action)</h3>
            <p>O botão que fica na extrema direita do menu.</p>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row">Texto do Botão</th>
                    <td><input type="text" name="hofm_cta_text" value="<?php echo esc_attr(hofm_opt('hofm_cta_text')); ?>" style="width: 100%;" /></td>
                </tr>
                <tr valign="top">
                    <th scope="row">Link do Botão</th>
                    <td><input type="url" name="hofm_cta_url" value="<?php echo esc_attr(get_option('hofm_cta_url')); ?>" style="width: 100%;" /></td>
                </tr>
            </table>

            <?php submit_button('Salvar Alterações'); ?>
        </form>
    </div>

    <script>
        jQuery(document).ready(function($){
            // Inicia o Color Picker do WordPress
            $('.hofm-color-picker').wpColorPicker();

            // Script para Upload de Imagem
            var mediaUploader;
            $('#hofm_upload_button').click(function(e) {
                e.preventDefault();
                if (mediaUploader) {
                    mediaUploader.open();
                    return;
                }
                mediaUploader = wp.media.frames.file_frame = wp.media({
                    title: 'Escolha a imagem do Logo',
                    button: { text: 'Usar esta imagem' },
                    multiple: false
                });
                mediaUploader.on('select', function() {
                    var attachment = mediaUploader.state().get('selection').first().toJSON();
                    $('#hofm_logo_img').val(attachment.url);
                    $('#hofm_logo_preview').attr('src', attachment.url).show();
                });
                mediaUploader.open();
            });

            // Script para Adicionar/Excluir Links Centrais
            $('#hofm-add-btn').click(function() {
                var hiddenRows = $('.hofm-link-row:hidden');
                if(hiddenRows.length > 0) {
                    $(hiddenRows[0]).fadeIn();
                }
                // Oculta o botão se todos os 5 já estiverem visíveis
                if($('.hofm-link-row:hidden').length === 0) {
                    $(this).hide();
                }
            });

            $('.hofm-remove-btn').click(function() {
                var rowId = $(this).data('row');
                $('#row-' + rowId).fadeOut(function() {
                    // Limpa os valores ao excluir
                    $('#row-' + rowId + ' input').val('');
                    $('#hofm-add-btn').fadeIn();
                });
            });

            // Verificação inicial do botão Adicionar
            if($('.hofm-link-row:hidden').length === 0) {
                $('#hofm-add-btn').hide();
            }
        });
    </script>
    <?php
}

// 5. Renderizar o Menu no Rodapé (Frontend)
add_action('wp_footer', 'hofm_render_frontend_menu');
function hofm_render_frontend_menu() {
    $logo_img = get_option('hofm_logo_img');
    $logo_url = get_option('hofm_logo_url');
    $cta_text = hofm_opt('hofm_cta_text');
    $cta_url  = get_option('hofm_cta_url');

    // Cores Personalizadas (pré-configuradas com a marca do Hospital Ocular de Sergipe)
    $bg_color        = hofm_opt('hofm_bg_color');
    $link_color      = hofm_opt('hofm_link_color');
    $divider_color   = hofm_opt('hofm_divider_color');
    $cta_bg_color    = hofm_opt('hofm_cta_bg_color');
    $cta_bg_color_2  = hofm_opt('hofm_cta_bg_color_2');
    $cta_text_color  = hofm_opt('hofm_cta_text_color');

    // Se não houver nada configurado, não mostra nada.
    if (!$logo_img && !$cta_text) return;

    // Logo (sem divisor ao lado) e links centrais (com divisor só entre eles)
    $logo_html = '';
    if ($logo_img) {
        $logo_html = '<a href="' . esc_url($logo_url) . '" class="hofm-logo"><img src="' . esc_url($logo_img) . '" alt="Logo"></a>';
    }
    $items = [];
    $mobile_links = [];
    for ($i = 1; $i <= 5; $i++) {
        $l_text = hofm_opt('hofm_link_'.$i.'_text');
        $l_url  = get_option('hofm_link_'.$i.'_url');
        if (!empty($l_text)) {
            $items[] = '<a href="' . esc_url($l_url) . '" class="hofm-link">' . esc_html($l_text) . '</a>';
            if (hofm_opt('hofm_link_'.$i.'_hide_mobile') !== '1') {
                $mobile_links[] = '<a href="' . esc_url($l_url) . '" class="hofm-m-link">' . esc_html($l_text) . '</a>';
            }
        }
    }
    // A grade do celular comporta até 3 links (além da logo e do CTA)
    $mobile_links = array_slice($mobile_links, 0, 3);
    ?>
    <style>
        .hofm-floating-wrapper {
            position: fixed;
            bottom: 30px;
            left: 0;
            width: 100%;
            display: flex;
            justify-content: center;
            z-index: 999999;
            pointer-events: none; /* Permite clicar através da área transparente */

            /* Animação Inicial de Fade - Configurada no JS */
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.4s ease, transform 0.4s ease;
        }

        .hofm-floating-wrapper.is-visible {
            opacity: 1;
            transform: translateY(0);
        }

        .hofm-floating-menu {
            position: relative; /* Ancora o botão de fechar no canto */
            pointer-events: auto; /* Reativa cliques dentro do menu */
            background-color: <?php echo esc_attr($bg_color); ?>;
            padding: 8px 10px 8px 18px;
            border-radius: 22px;
            display: flex;
            align-items: center;
            gap: 0;
            box-shadow: 0 20px 45px -12px rgba(15, 60, 100, 0.25), 0 2px 8px rgba(15, 60, 100, 0.06);
            border: 1px solid rgba(15, 60, 100, 0.06);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            max-width: 95vw; /* Impede que o menu vaze a tela em tamanhos intermediários */
        }

        /* Botão "x" para fechar o menu (desktop e mobile) */
        .hofm-close-btn {
            position: absolute;
            top: -10px;
            right: -10px;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: #ffffff;
            border: 1px solid rgba(15, 60, 100, 0.12);
            box-shadow: 0 4px 10px rgba(15, 60, 100, 0.18);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            margin: 0;
            font-size: 15px;
            line-height: 1;
            font-family: inherit;
            color: #5b7186;
            cursor: pointer;
            z-index: 2;
            appearance: none;
            -webkit-appearance: none;
            transition: all 0.2s ease;
        }
        .hofm-close-btn:hover,
        .hofm-close-btn:focus-visible {
            background: #f3f6f8;
            color: <?php echo esc_attr($link_color); ?>;
        }

        /* 1. Item Logo */
        .hofm-logo {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 52px;
            padding-right: 18px;
            flex-shrink: 0;
            text-decoration: none;
        }
        .hofm-logo img {
            height: 100%;
            width: auto;
            max-width: 150px;
            object-fit: contain;
        }

        /* Divisores entre os itens */
        .hofm-divider {
            width: 2px;
            height: 32px;
            background-color: <?php echo esc_attr($divider_color); ?>;
            border-radius: 2px;
            margin: 0 18px;
            flex-shrink: 0;
        }

        /* 2. Links Centrais */
        .hofm-floating-menu a.hofm-link {
            background: transparent;
            color: <?php echo esc_attr($link_color); ?> !important;
            padding: 12px 6px;
            min-height: 20px;
            display: inline-flex;
            align-items: center;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 700;
            text-decoration: none !important;
            transition: all 0.25s ease;
            white-space: nowrap;
        }
        .hofm-floating-menu a.hofm-link:hover,
        .hofm-floating-menu a.hofm-link:focus-visible {
            background-color: rgba(20, 90, 140, 0.08);
            color: <?php echo esc_attr($link_color); ?> !important;
            text-decoration: none !important;
        }

        /* 3. Call to Action (CTA) */
        .hofm-floating-menu a.hofm-cta {
            background: linear-gradient(135deg, <?php echo esc_attr($cta_bg_color); ?>, <?php echo esc_attr($cta_bg_color_2); ?>);
            color: <?php echo esc_attr($cta_text_color); ?> !important;
            padding: 16px 28px;
            display: inline-flex;
            align-items: center;
            border-radius: 14px;
            font-size: 15px;
            font-weight: 700;
            text-decoration: none !important;
            transition: all 0.3s ease;
            white-space: nowrap;
            margin-left: 18px;
            flex-shrink: 0;
            box-shadow: 0 8px 20px -6px rgba(21, 74, 144, 0.5);
        }
        .hofm-floating-menu a.hofm-cta:hover,
        .hofm-floating-menu a.hofm-cta:focus-visible {
            color: <?php echo esc_attr($cta_text_color); ?> !important;
            transform: scale(1.02);
            box-shadow: 0 10px 25px -6px rgba(21, 74, 144, 0.6);
            text-decoration: none !important;
            filter: brightness(1.05);
        }

        /* Grade exibida só no celular (logo + até 3 links + CTA numa 3ª coluna, ocupando as duas linhas) */
        .hofm-mobile-menu {
            display: none;
        }

        /* Responsividade para Celulares */
        @media (max-width: 768px) {
            .hofm-floating-wrapper {
                bottom: 16px;
            }
            /* Esconde a versão "pílula" de desktop e mostra a grade */
            .hofm-floating-menu {
                display: none;
            }
            .hofm-mobile-menu {
                pointer-events: auto;
                position: relative; /* Ancora o botão de fechar fora da área recortada da grade */
                display: inline-block;
            }
            .hofm-mobile-grid {
                display: grid;
                grid-template-columns: 1fr 1fr 0.85fr;
                grid-auto-rows: 1fr;
                width: 88vw;
                max-width: 340px;
                background-color: <?php echo esc_attr($bg_color); ?>;
                border-radius: 20px;
                overflow: hidden; /* Recorta o canto do CTA para acompanhar o raio do container */
                box-shadow: 0 20px 45px -12px rgba(15, 60, 100, 0.25), 0 2px 8px rgba(15, 60, 100, 0.06);
                border: 1px solid rgba(15, 60, 100, 0.06);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            .hofm-mobile-grid .hofm-m-cell {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 60px;
                padding: 10px;
            }
            .hofm-mobile-grid .hofm-m-logo {
                border-right: 1px solid <?php echo esc_attr($divider_color); ?>;
                border-bottom: 1px solid <?php echo esc_attr($divider_color); ?>;
            }
            .hofm-mobile-grid .hofm-m-logo img {
                height: 30px;
                width: auto;
                max-width: 100%;
                object-fit: contain;
            }
            .hofm-mobile-grid .hofm-m-link-a {
                border-bottom: 1px solid <?php echo esc_attr($divider_color); ?>;
            }
            .hofm-mobile-grid .hofm-m-link-b {
                border-right: 1px solid <?php echo esc_attr($divider_color); ?>;
            }
            .hofm-mobile-grid a.hofm-m-link {
                color: <?php echo esc_attr($link_color); ?> !important;
                font-size: 15px;
                font-weight: 700;
                text-decoration: none !important;
                text-align: center;
            }
            .hofm-mobile-grid .hofm-m-cta-cell {
                grid-column: 3;
                grid-row: 1 / span 2;
                padding: 0;
            }
            .hofm-mobile-grid a.hofm-m-cta {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                text-align: center;
                background: linear-gradient(135deg, <?php echo esc_attr($cta_bg_color); ?>, <?php echo esc_attr($cta_bg_color_2); ?>);
                color: <?php echo esc_attr($cta_text_color); ?> !important;
                font-size: 14px;
                font-weight: 700;
                text-decoration: none !important;
                padding: 8px;
            }
            .hofm-mobile-grid a.hofm-m-cta:hover,
            .hofm-mobile-grid a.hofm-m-cta:focus-visible {
                color: <?php echo esc_attr($cta_text_color); ?> !important;
                filter: brightness(1.05);
            }
        }
    </style>

    <div class="hofm-floating-wrapper">
        <div class="hofm-floating-menu">

            <?php echo $logo_html; ?>
            <?php echo implode('<span class="hofm-divider"></span>', $items); ?>

            <?php if ($cta_text): ?>
                <a href="<?php echo esc_url($cta_url); ?>" class="hofm-cta"><?php echo esc_html($cta_text); ?></a>
            <?php endif; ?>

            <button type="button" class="hofm-close-btn" aria-label="Fechar menu">&times;</button>

        </div>

        <!-- Grade exibida só no celular: logo + até 3 links (2 colunas, 2 linhas) + CTA na 3ª coluna -->
        <div class="hofm-mobile-menu">
            <div class="hofm-mobile-grid">
                <div class="hofm-m-cell hofm-m-logo">
                    <?php if ($logo_img): ?>
                    <a href="<?php echo esc_url($logo_url); ?>"><img src="<?php echo esc_url($logo_img); ?>" alt="Logo"></a>
                    <?php endif; ?>
                </div>
                <div class="hofm-m-cell hofm-m-link-a">
                    <?php echo isset($mobile_links[0]) ? $mobile_links[0] : ''; ?>
                </div>
                <div class="hofm-m-cell hofm-m-link-b">
                    <?php echo isset($mobile_links[1]) ? $mobile_links[1] : ''; ?>
                </div>
                <div class="hofm-m-cell hofm-m-link-c">
                    <?php echo isset($mobile_links[2]) ? $mobile_links[2] : ''; ?>
                </div>
                <div class="hofm-m-cell hofm-m-cta-cell">
                    <?php if ($cta_text): ?>
                    <a href="<?php echo esc_url($cta_url); ?>" class="hofm-m-cta"><?php echo esc_html($cta_text); ?></a>
                    <?php endif; ?>
                </div>
            </div>
            <button type="button" class="hofm-close-btn" aria-label="Fechar menu">&times;</button>
        </div>

    </div>

    <script>
        // Lógica de aparecer / desaparecer com fade baseada na rolagem da página
        document.addEventListener('DOMContentLoaded', function() {
            var menuWrapper = document.querySelector('.hofm-floating-wrapper');
            if (!menuWrapper) return;

            // Se o visitante já fechou o menu nesta visita, mantém escondido
            var dismissed = false;
            try {
                dismissed = sessionStorage.getItem('hofm_menu_closed') === '1';
            } catch (e) {}

            function toggleMenuVisibility() {
                if (dismissed) {
                    menuWrapper.classList.remove('is-visible');
                    return;
                }
                // Se a rolagem for maior que 150px para baixo, exibe o menu
                if (window.scrollY > 150) {
                    menuWrapper.classList.add('is-visible');
                } else {
                    menuWrapper.classList.remove('is-visible');
                }
            }

            // Botão "x": fecha o menu e não mostra de novo até o fim da visita
            document.querySelectorAll('.hofm-close-btn').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.preventDefault();
                    dismissed = true;
                    menuWrapper.classList.remove('is-visible');
                    try {
                        sessionStorage.setItem('hofm_menu_closed', '1');
                    } catch (e) {}
                });
            });

            // Ouve o evento de rolagem (scroll)
            window.addEventListener('scroll', toggleMenuVisibility);

            // Checagem imediata caso a página já tenha sido carregada num ponto mais baixo
            toggleMenuVisibility();
        });
    </script>
    <?php
}
