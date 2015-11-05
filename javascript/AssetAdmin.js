/**
 * File: AssetAdmin.js
 */

(function($) {
	$.entwine('ss', function($){

		/**
		 * Add some AssetAdmin specific event listeners for communicating between the GridField and GalleryField.
		 */
		$('.AssetAdmin .asset-gallery').entwine({
			/**
			 * Listeners / callbacks which get passed into the GalleryField.
			 * This lets us update GalleryField when GridField changes.
			 */
			getProps: function () {
				return this._super({
					cmsEvents: {
						// Sync the GalleryField when we navigate folders in the GridField.
						'asset-admin.gridfield.folder-changed': function (event, id) {
							var folder = this.getFileById(id),
								folderName = ''; // Default to the top level

							if (folder !== null) {
								folderName = folder.filename;
							}

							this.onNavigate(folderName, true);
						},
						// Sync the GalleryField when we delete an item from the GridField.
						'asset-admin.gridfield.item-deleted': function (event, id) {
							// Reload the gallery.
							this.props.backend.navigate(this.props.current_folder);
						}
					}
				});
			}
		});

		/**
		 * Listen for changes to the GalleryField.
		 * These event are triggered within the GalleryField component.
		 */
		$('.AssetAdmin.cms-edit-form .ss-gridfield').entwine({
			onadd: function () {
				this._super();

				// Sync the GridField when the GalleryField's folder changes.
				$(document).on('asset-gallery-field.folder-changed', function (event, id) {
					$('.cms-container').loadPanel(this.data('urlFolderTemplate').replace('%s', id));
				}.bind(this));

				// Sync the GridField when the GalleryField deletes a file.
				$(document).on('asset-gallery-field.file-deleted', function (event) {
					this.reload();
				}.bind(this));

				// Sync the GridField when editing a file in the GalleryField.
				$(document).on('asset-gallery-field.enter-file-view', function (event, id) {
					var $form = this.closest('.cms-edit-form');

					// Hide the UploadField, 'add new folder' and 'up level' buttons.
					$form.find('.cms-content-toolbar').hide();
					$form.find('.ss-assetuploadfield').hide();

					// Also hide the 'change view mode' tabs because there's no equivalent view for GridField.
					// When editing a file in GridField you're at '/admin/assets/EditForm/field/File/item/<id>/edit'
					// so the GalleryField isn't available.
					$('.cms-content-header-tabs').hide();
				}.bind(this));

				// Sync the GridField when exiting file edit mode in the GalleryField.
				$(document).on('asset-gallery-field.exit-file-view', function (event) {
					var $form = this.closest('.cms-edit-form');

					// Show the UploadField, 'add new folder' button, 'up level' button, and tabs.
					$form.find('.cms-content-toolbar').show();
					$form.find('.ss-assetuploadfield').show();
					$('.cms-content-header-tabs').show();
				}.bind(this));
			},

			onremove: function () {
				this._super();

				$(document).off('asset-gallery-field.folder-changed');
				$(document).off('asset-gallery-field.file-deleted');
			}
		});

		/**
		 * Load folder detail view via controller methods
		 * rather than built-in GridField view (which is only geared towards showing files).
		 */
		$('.AssetAdmin.cms-edit-form .ss-gridfield-item').entwine({

			onclick: function(e) {
				var grid;

				// Let actions do their own thing
				if($(e.target).closest('.action').length) {
					this._super(e);
					return;
				}

				grid = this.closest('.ss-gridfield');

				if(this.data('class') === 'Folder') {
					var id = this.data('id'),
						url = grid.data('urlFolderTemplate').replace('%s', id);

					// Sync the Gallery component.
					$(document).trigger('asset-admin.gridfield.folder-changed', id);

					$('.cms-container').loadPanel(url);

					return false;
				}

				this._super(e);
			}
		});

		/**
		 * Sync the gallery view when the user navigates up one level using the gridfield.
		 */
		$('.AssetAdmin.cms-edit-form .grid-levelup').entwine({
			onmatch: function () {
				$('.AssetAdmin .cms-actions-row').prepend(this);
			},
			onclick: function (event) {
				var urlParts = this.prop('href').split('/');

				$(document).trigger('asset-admin.gridfield.folder-changed', urlParts[urlParts.length - 1]);

				$('.cms-container').saveTabState();

				this._super(event);
			}
		});
		
		/**
		 * Hide the asset-gallery's back button (Navigating up) is handled by the gridfield's back button
		 */
		$('.AssetAdmin.cms-edit-form .gallery__back').entwine({
			onmatch: function () {
				this.hide();
			}
		});
		
		/**
		 * Position the gallery's bulk actions component
		 */
		$('.AssetAdmin.cms-edit-form .gallery__bulk').entwine({
			onmatch: function () {
				var leftVal = $('.AssetAdmin .cms-content-toolbar').outerWidth() + $('.AssetAdmin .ss-uploadfield-fromcomputer').outerWidth() + 12;
				
				this.css('left', leftVal).show();
			}
		});

		$('.AssetAdmin.cms-edit-form .ss-gridfield .col-buttons .action.gridfield-button-delete, .AssetAdmin.cms-edit-form .Actions button.action.action-delete').entwine({
			onclick: function(e) {
				var msg,
					$gridFieldItem = this.closest('.ss-gridfield-item');

				if ($gridFieldItem.data('class') === 'Folder') {
					msg = ss.i18n._t('AssetAdmin.ConfirmDelete');
				} else {
					msg = ss.i18n._t('TABLEFIELD.DELETECONFIRMMESSAGE');
				}

				if (!confirm(msg)) {
					return false;
				}

				this.getGridField().reload({data: [{name: this.attr('name'), value: this.val()}]});
				e.preventDefault();

				// Sync the GalleryField
				$(document).trigger('asset-admin.gridfield.item-deleted', $gridFieldItem.data('id'));

				return false;
			}
		});

		$('.AssetAdmin.cms-edit-form :submit[name=action_delete]').entwine({
			onclick: function(e) {
				if(!confirm(ss.i18n._t('AssetAdmin.ConfirmDelete'))) return false;
				else this._super(e);
			}
		});

		/**
		 * Prompt for a new foldername, rather than using dedicated form.
		 * Better usability, but less flexibility in terms of inputs and validation.
		 * Mainly necessary because AssetAdmin->AddForm() returns don't play nicely
		 * with the nested AssetAdmin->EditForm() DOM structures.
		 */
		$('.AssetAdmin .cms-add-folder-link').entwine({
			onclick: function(e) {
				var name = prompt(ss.i18n._t('Folder.Name'));
				if(!name) return false;

				this.closest('.cms-container').loadPanel(this.data('url') + '&Name=' + name);
				return false;
			}
		});

		/**
		 * Class: #Form_SyncForm
		 */
		$('#Form_SyncForm').entwine({

			/**
			 * Function: onsubmit
			 *
			 * Parameters:
			 *  (Event) e
			 */
			onsubmit: function(e) {
				var button = jQuery(this).find(':submit:first');
				button.addClass('loading');
				$.ajax({
					url: jQuery(this).attr('action'),
					data: this.serializeArray(),
					success: function() {
						button.removeClass('loading');
						// reload current form and tree
						var currNode = $('.cms-tree')[0].firstSelected();
						if(currNode) {
						  var url = $(currNode).find('a').attr('href');
							$('.cms-content').loadPanel(url);
						}
						$('.cms-tree')[0].setCustomURL('admin/assets/getsubtree');
						$('.cms-tree')[0].reload({onSuccess: function() {
							// TODO Reset current tree node
						}});
					}
				});

				return false;
			}
		});

		/**
		 * Reload the gridfield and asset-gallery to show the user the file has been added
		 */
		$('.AssetAdmin.cms-edit-form .ss-uploadfield-item.template-download').entwine({
			onmatch: function () {
				this._super();
				
				$('.asset-gallery').trigger('cms.fileAdded');
				$('.AssetAdmin.cms-edit-form .ss-gridfield').reload();
			}
		});

		$('.AssetAdmin .cms-panel-link').entwine({
			onclick: function () {
				//If details view
				if ($('div.content-detailsview').is(':visible')) {
					$('div.ss-upload, .AssetAdmin .cms-content-toolbar').hide();
				} else {
					$('div.ss-upload, .AssetAdmin .cms-content-toolbar').show();
				}
			}
		});
	});
}(jQuery));
