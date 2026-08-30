<div id="upgrade-controls">
    <div class="row mb-3">
        <div class="col-lg-6 col-sm-12"><label for="upgrade-value">Value</label><input id="upgrade-value" class="form-control" value="Preserved value"></div>
        <div class="col-lg-6 col-sm-12"><p class="alert alert-info mt-2">Legacy application content</p></div>
    </div>
    <div class="d-flex flex-wrap mb-3" style="gap:8px">
        <button id="upgrade-open" type="button" class="btn btn-primary" data-toggle="modal" data-target="#upgrade-modal">Open modal</button>
        <div class="dropdown">
            <button id="upgrade-menu" type="button" class="btn" data-toggle="dropdown" aria-expanded="false">Actions</button>
            <div class="dropdown-menu"><button type="button" class="dropdown-item" id="upgrade-first">First action</button><button type="button" class="dropdown-item" id="upgrade-last">Last action</button></div>
        </div>
        <button id="upgrade-help" type="button" class="btn" title="Legacy tooltip">Help</button>
        <button id="upgrade-popover" type="button" class="btn">Details</button>
        <button id="upgrade-collapse" type="button" class="btn" data-toggle="collapse" data-target="#upgrade-panel" aria-expanded="false">Expand</button>
        <button id="upgrade-save" type="button" class="btn" data-loading-text="Saving">Save</button>
    </div>
    <div id="upgrade-panel" class="collapse"><p>Collapsible content</p></div>
    <ul class="nav nav-tabs">
        <li class="nav-item"><a id="upgrade-tab-one" class="nav-link active" data-toggle="tab" href="#upgrade-one">First tab</a></li>
        <li class="nav-item"><a id="upgrade-tab-two" class="nav-link" data-toggle="tab" href="#upgrade-two">Second tab</a></li>
    </ul>
    <div class="tab-content"><div id="upgrade-one" class="tab-pane active">First panel</div><div id="upgrade-two" class="tab-pane">Second panel</div></div>
    <div id="upgrade-modal" class="modal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h2 class="modal-title">Legacy modal</h2><button type="button" class="close" data-dismiss="modal" aria-label="Close">×</button></div><div class="modal-body"><label for="upgrade-modal-input">Modal value</label><input id="upgrade-modal-input" class="form-control"></div><div class="modal-footer"><button type="button" class="btn" data-dismiss="modal">Close modal</button></div></div></div>
    </div>
</div>
<script>
    window.upgradeEvents = [];
    $('#upgrade-modal').on('shown.bs.modal hidden.bs.modal', function (event) { window.upgradeEvents.push(event.type); });
    $('#upgrade-help').tooltip();
    $('#upgrade-popover').popover({content: 'Legacy popover', trigger: 'click', placement: 'bottom'});
    $('#upgrade-panel').collapse({toggle: false});
    $('#upgrade-save').on('click', function () { $(this).button('loading'); });
</script>
