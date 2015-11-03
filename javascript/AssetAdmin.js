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
						'asset-admin.gridfield.folder-changed': function (event, id) {
							var folder = this.getFileById(id),
								folderName = ''; // Default to the top level

							if (folder !== null) {
								folderName = folder.filename;
							}

							this.onNavigate(folderName, true);
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

				$(document).on('asset-gallery-field.folder-changed', function (event, id) {
					$('.cms-container').loadPanel(this.data('urlFolderTemplate').replace('%s', id));
				}.bind(this));
			},

			onremove: function () {
				this._super();

				$(document).off('asset-gallery-field.folder-changed');
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
		$('.AssetAdmin.cms-edit-form .list-parent-link').entwine({
			onclick: function (event) {
				var urlParts = this.prop('href').split('/');

				$(document).trigger('asset-admin.gridfield.folder-changed', urlParts[urlParts.length - 1]);

				$('.cms-container').saveTabState();

				this._super(event);
			}
		});

		$('.AssetAdmin.cms-edit-form .ss-gridfield .col-buttons .action.gridfield-button-delete, .AssetAdmin.cms-edit-form .Actions button.action.action-delete').entwine({
			onclick: function(e) {
				var msg;
				if(this.closest('.ss-gridfield-item').data('class') == 'Folder') {
					msg = ss.i18n._t('AssetAdmin.ConfirmDelete');
				} else {
					msg = ss.i18n._t('TABLEFIELD.DELETECONFIRMMESSAGE');
				}
				if(!confirm(msg)) return false;

				this.getGridField().reload({data: [{name: this.attr('name'), value: this.val()}]});
				e.preventDefault();
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
		
		$('.AssetAdmin .grid-levelup').entwine({
			onmatch: function () {
				$('.AssetAdmin .cms-actions-row').prepend(this);
			}
		});

		$('.AssetAdmin .cms-panel-link').entwine({
			onclick: function () {
				//If gallery view
				if ($('div.content-galleryview').is(':visible')) {
					$('.grid-levelup').hide();
				} else {
					$('.grid-levelup').show();
				}
				
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
